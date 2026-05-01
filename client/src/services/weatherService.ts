import api from "../config/api";
// The weatherService module provides functions for fetching weather-related data, specifically the current UV index and related weather information based on geographic coordinates. It defines a data structure for the UV snapshot and includes a method to retrieve this information from the backend API, which can be used to inform users about sun exposure risks when evaluating products that may be affected by UV conditions.
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
