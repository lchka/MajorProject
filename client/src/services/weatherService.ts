import api from "../config/api";

export interface CurrentUvSnapshot {
  lat: number;
  lon: number;
  uvIndex: number;
  temperatureCelsius: number | null;
  weatherMain: string | null;
  weatherDescription: string | null;
  fetchedAtUnix: number;
}

export const weatherService = {
  getCurrentUv: async (lat: number, lon: number): Promise<CurrentUvSnapshot> => {
    const response = await api.get(`/weather/uv`, {
      params: { lat, lon },
    });

    return response.data;
  },
};

export default weatherService;
