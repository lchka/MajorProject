import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

const DEFAULT_API_PORT = '3000';
const DEFAULT_API_PATH = '/api';

const getMetroHost = (): string | null => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;

  if (!scriptURL) {
    return null;
  }

  try {
    const parsedUrl = new URL(scriptURL);
    return parsedUrl.hostname;
  } catch {
    return null;
  }
};

const normalizeAndroidLocalhost = (url: string): string => {
  if (Platform.OS !== 'android') {
    return url;
  }

  return url
    .replace('http://localhost:', 'http://10.0.2.2:')
    .replace('http://127.0.0.1:', 'http://10.0.2.2:');
};

const buildDefaultApiUrl = (): string => {
  const metroHost = getMetroHost();

  if (metroHost) {
    const host = Platform.OS === 'android' && (metroHost === 'localhost' || metroHost === '127.0.0.1')
      ? '10.0.2.2'
      : metroHost;

    return `http://${host}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
  }

  return `http://localhost:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
};

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL = normalizeAndroidLocalhost(envApiUrl || buildDefaultApiUrl());

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // You can add auth token here later
    // const token = await AsyncStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Handle unauthorized (e.g., redirect to login)
          console.error('Unauthorized - please login');
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('An error occurred:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - please check your connection');
      error.message = `Network Error: Cannot reach API at ${API_URL}`;
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
