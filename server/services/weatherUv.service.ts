import {
  BAD_REQUEST,
  HttpError,
  INTERNAL_SERVER_ERROR,
  SERVICE_UNAVAILABLE,
} from "../utils/HttpError.js";

// Shape of the UV data returned to the frontend
export type CurrentUvSnapshot = {
  lat: number;
  lon: number;
  uvIndex: number;
  temperatureCelsius: number | null;
  weatherMain: string | null;
  weatherDescription: string | null;
  fetchedAtUnix: number;
};

// Partial type for OpenWeather current weather response
type OpenWeatherCurrentWeatherResponse = {
  coord?: { lat?: number; lon?: number };
  dt?: number;
  main?: { temp?: number };
  weather?: Array<{ main?: string; description?: string }>;
};

// Partial type for Open-Meteo response (we only care about current values)
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

// Cached snapshot with timestamp (used to avoid unnecessary API calls)
type CachedUvSnapshot = {
  snapshot: CurrentUvSnapshot;
  cachedAtUnix: number;
};

export class WeatherUvService {
  // Base URLs for both APIs
  private readonly currentWeatherUrl =
    "https://api.openweathermap.org/data/2.5/weather";
  private readonly openMeteoUrl =
    "https://api.open-meteo.com/v1/forecast";

  // Cache lasts 30 minutes
  private readonly cacheTtlSeconds = 30 * 60;

  // In-memory cache (key = rounded lat/lon)
  private readonly uvSnapshotCache = new Map<string, CachedUvSnapshot>();

  // Generate cache key (round coords to reduce duplicates)
  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(3)}:${lon.toFixed(3)}`;
  }

  // Try get cached UV snapshot if still valid
  private getCachedSnapshot(
    lat: number,
    lon: number
  ): CurrentUvSnapshot | null {
    const cacheKey = this.getCacheKey(lat, lon);
    const cached = this.uvSnapshotCache.get(cacheKey);
    if (!cached) return null;

    const ageSeconds =
      Math.floor(Date.now() / 1000) - cached.cachedAtUnix;

    // Remove expired cache
    if (ageSeconds > this.cacheTtlSeconds) {
      this.uvSnapshotCache.delete(cacheKey);
      return null;
    }

    return cached.snapshot;
  }

  // Store snapshot in cache
  private setCachedSnapshot(
    lat: number,
    lon: number,
    snapshot: CurrentUvSnapshot
  ): void {
    const cacheKey = this.getCacheKey(lat, lon);
    this.uvSnapshotCache.set(cacheKey, {
      snapshot,
      cachedAtUnix: Math.floor(Date.now() / 1000),
    });
  }

  // Get OpenWeather API key (optional, app still works without it)
  private getOptionalOpenWeatherKey(): string | null {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY?.trim();
    return apiKey || null;
  }

  // Validate coordinates before making any API calls
  private validateCoordinateRange(lat: number, lon: number): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new HttpError(
        BAD_REQUEST,
        "Latitude and longitude must be valid numbers."
      );
    }

    if (lat < -90 || lat > 90) {
      throw new HttpError(
        BAD_REQUEST,
        "Latitude must be between -90 and 90."
      );
    }

    if (lon < -180 || lon > 180) {
      throw new HttpError(
        BAD_REQUEST,
        "Longitude must be between -180 and 180."
      );
    }
  }

  // Convert Open-Meteo weather codes into readable text
  private weatherCodeToDescription(
    code: number | undefined
  ): string | null {
    if (typeof code !== "number") return null;

    if (code === 0) return "Clear sky";
    if (code >= 1 && code <= 3) return "Partly cloudy";
    if (code >= 45 && code <= 48) return "Fog";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
      return "Rain";
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))
      return "Snow";
    if (code >= 95 && code <= 99) return "Thunderstorm";

    return null;
  }

  // Fetch current weather (temperature + description) from OpenWeather
  private async fetchOpenWeatherCurrentWeather(
    lat: number,
    lon: number,
    apiKey: string
  ): Promise<OpenWeatherCurrentWeatherResponse | null> {
    const url = new URL(this.currentWeatherUrl);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", apiKey);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) return null;

      return (await response.json()) as OpenWeatherCurrentWeatherResponse;
    } catch {
      // Fail silently (not critical)
      return null;
    }
  }

  // Fetch UV + basic weather data from Open-Meteo (main source)
  private async fetchOpenMeteoUv(
    lat: number,
    lon: number
  ): Promise<CurrentUvSnapshot> {
    const url = new URL(this.openMeteoUrl);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "current",
      "uv_index,temperature_2m,weather_code"
    );
    url.searchParams.set("timezone", "auto");

    let response: Response;

    try {
      response = await fetch(url.toString());
    } catch {
      // Network-level failure
      throw new HttpError(
        INTERNAL_SERVER_ERROR,
        "Unable to reach fallback UV provider."
      );
    }

    if (!response.ok) {
      throw new HttpError(
        INTERNAL_SERVER_ERROR,
        `Fallback UV provider request failed (${response.status}).`
      );
    }

    let data: OpenMeteoCurrentResponse;

    try {
      data = (await response.json()) as OpenMeteoCurrentResponse;
    } catch {
      throw new HttpError(
        INTERNAL_SERVER_ERROR,
        "Fallback UV provider returned invalid JSON."
      );
    }

    const current = data.current;

    // Handle missing UV safely (important for night-time cases)
    const uvIndex =
      typeof current?.uv_index === "number"
        ? current.uv_index
        : 0;

    const unixTime = current?.time
      ? Math.floor(new Date(current.time).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    return {
      lat:
        typeof data.latitude === "number"
          ? data.latitude
          : lat,
      lon:
        typeof data.longitude === "number"
          ? data.longitude
          : lon,
      uvIndex,
      temperatureCelsius:
        typeof current?.temperature_2m === "number"
          ? current.temperature_2m
          : null,
      weatherMain: this.weatherCodeToDescription(
        current?.weather_code
      ),
      weatherDescription: this.weatherCodeToDescription(
        current?.weather_code
      ),
      fetchedAtUnix: Number.isFinite(unixTime)
        ? unixTime
        : Math.floor(Date.now() / 1000),
    };
  }

  // Main method used by controller
  async getCurrentUvByCoordinates(
    lat: number,
    lon: number
  ): Promise<CurrentUvSnapshot> {
    this.validateCoordinateRange(lat, lon);

    let snapshot: CurrentUvSnapshot;

    try {
      // Primary data source
      snapshot = await this.fetchOpenMeteoUv(lat, lon);
      this.setCachedSnapshot(lat, lon, snapshot);
    } catch {
      // If API fails, try cached data
      const cachedSnapshot = this.getCachedSnapshot(lat, lon);

      if (!cachedSnapshot) {
        // No cache = fail request
        throw new HttpError(
          SERVICE_UNAVAILABLE,
          "UV data provider is temporarily unavailable. Please try again shortly."
        );
      }

      snapshot = cachedSnapshot;
    }

    // Enrich with OpenWeather data (optional)
    const apiKey = this.getOptionalOpenWeatherKey();
    if (!apiKey) return snapshot;

    const currentWeather =
      await this.fetchOpenWeatherCurrentWeather(
        lat,
        lon,
        apiKey
      );

    if (!currentWeather) return snapshot;

    const weather = Array.isArray(currentWeather.weather)
      ? currentWeather.weather[0]
      : undefined;

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
      weatherDescription:
        weather?.description ?? snapshot.weatherDescription,
      fetchedAtUnix:
        typeof currentWeather.dt === "number"
          ? currentWeather.dt
          : snapshot.fetchedAtUnix,
    };
  }
}

// Export instance
export default new WeatherUvService();