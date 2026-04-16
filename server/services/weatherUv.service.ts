import { BAD_REQUEST, HttpError, INTERNAL_SERVER_ERROR } from "../utils/HttpError.js";

export type CurrentUvSnapshot = {
  lat: number;
  lon: number;
  uvIndex: number;
  temperatureCelsius: number | null;
  weatherMain: string | null;
  weatherDescription: string | null;
  fetchedAtUnix: number;
};

type OpenWeatherCurrentWeatherResponse = {
  coord?: { lat?: number; lon?: number };
  dt?: number;
  main?: { temp?: number };
  weather?: Array<{ main?: string; description?: string }>;
};

type OpenMeteoCurrentResponse = {
  latitude?: number;
  longitude?: number;
  current?: {
    time?: string;
    uv_index?: number;
    temperature_2m?: number;
    weather_code?: number;
  };
};

export class WeatherUvService {
  private readonly currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather";
  private readonly openMeteoUrl = "https://api.open-meteo.com/v1/forecast";

  private getOptionalOpenWeatherKey(): string | null {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY?.trim();
    return apiKey || null;
  }

  private validateCoordinateRange(lat: number, lon: number): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new HttpError(BAD_REQUEST, "Latitude and longitude must be valid numbers.");
    }

    if (lat < -90 || lat > 90) {
      throw new HttpError(BAD_REQUEST, "Latitude must be between -90 and 90.");
    }

    if (lon < -180 || lon > 180) {
      throw new HttpError(BAD_REQUEST, "Longitude must be between -180 and 180.");
    }
  }

  private weatherCodeToDescription(code: number | undefined): string | null {
    if (typeof code !== "number") {
      return null;
    }

    if (code === 0) {
      return "Clear sky";
    }
    if (code >= 1 && code <= 3) {
      return "Partly cloudy";
    }
    if (code >= 45 && code <= 48) {
      return "Fog";
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return "Rain";
    }
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      return "Snow";
    }
    if (code >= 95 && code <= 99) {
      return "Thunderstorm";
    }

    return null;
  }

  private async fetchOpenWeatherCurrentWeather(
    lat: number,
    lon: number,
    apiKey: string,
  ): Promise<OpenWeatherCurrentWeatherResponse | null> {
    const url = new URL(this.currentWeatherUrl);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", apiKey);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        return null;
      }

      return (await response.json()) as OpenWeatherCurrentWeatherResponse;
    } catch {
      return null;
    }
  }

  private async fetchOpenMeteoUv(lat: number, lon: number): Promise<CurrentUvSnapshot> {
    const url = new URL(this.openMeteoUrl);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", "uv_index,temperature_2m,weather_code");
    url.searchParams.set("timezone", "auto");

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch {
      throw new HttpError(INTERNAL_SERVER_ERROR, "Unable to reach fallback UV provider.");
    }

    if (!response.ok) {
      throw new HttpError(
        INTERNAL_SERVER_ERROR,
        `Fallback UV provider request failed (${response.status}).`,
      );
    }

    let data: OpenMeteoCurrentResponse;
    try {
      data = (await response.json()) as OpenMeteoCurrentResponse;
    } catch {
      throw new HttpError(INTERNAL_SERVER_ERROR, "Fallback UV provider returned invalid JSON.");
    }

    const current = data.current;
    if (!current || typeof current.uv_index !== "number") {
      throw new HttpError(INTERNAL_SERVER_ERROR, "Fallback UV provider missing current UV data.");
    }

    const unixTime = current.time
      ? Math.floor(new Date(current.time).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    return {
      lat: typeof data.latitude === "number" ? data.latitude : lat,
      lon: typeof data.longitude === "number" ? data.longitude : lon,
      uvIndex: current.uv_index,
      temperatureCelsius:
        typeof current.temperature_2m === "number" ? current.temperature_2m : null,
      weatherMain: this.weatherCodeToDescription(current.weather_code),
      weatherDescription: this.weatherCodeToDescription(current.weather_code),
      fetchedAtUnix: Number.isFinite(unixTime) ? unixTime : Math.floor(Date.now() / 1000),
    };
  }

  async getCurrentUvByCoordinates(lat: number, lon: number): Promise<CurrentUvSnapshot> {
    this.validateCoordinateRange(lat, lon);
    const snapshot = await this.fetchOpenMeteoUv(lat, lon);
    const apiKey = this.getOptionalOpenWeatherKey();

    if (!apiKey) {
      return snapshot;
    }

    const currentWeather = await this.fetchOpenWeatherCurrentWeather(lat, lon, apiKey);
    if (!currentWeather) {
      return snapshot;
    }

    const weather = Array.isArray(currentWeather.weather) ? currentWeather.weather[0] : undefined;

    return {
      ...snapshot,
      lat:
        typeof currentWeather.coord?.lat === "number"
          ? currentWeather.coord.lat
          : snapshot.lat,
      lon:
        typeof currentWeather.coord?.lon === "number"
          ? currentWeather.coord.lon
          : snapshot.lon,
      temperatureCelsius:
        typeof currentWeather.main?.temp === "number"
          ? currentWeather.main.temp
          : snapshot.temperatureCelsius,
      weatherMain: weather?.main ?? snapshot.weatherMain,
      weatherDescription: weather?.description ?? snapshot.weatherDescription,
      fetchedAtUnix:
        typeof currentWeather.dt === "number" ? currentWeather.dt : snapshot.fetchedAtUnix,
    };
  }
}

export default new WeatherUvService();
