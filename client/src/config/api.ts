import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'authToken';

const DEFAULT_API_PORT = '3000';
const DEFAULT_API_PATH = '/api';

const ensureApiBasePath = (url: string): string => {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed}/api`;
};

const extractHostname = (value: string): string | null => {
  const normalized = value.includes('://') ? value : `http://${value}`;
  const withoutProtocol = normalized.split('://')[1] || '';
  const hostAndPath = withoutProtocol.split('/')[0] || '';
  const hostname = hostAndPath.split(':')[0] || '';

  return hostname || null;
};

const getMetroHost = (): string | null => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;


  const linkingUri = (Constants as any)?.linkingUri as string | undefined;
  if (linkingUri) {
    const host = extractHostname(linkingUri);
    if (host) {
      return host;
    }
  }

  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    return hostUri.split(':')[0] || null;
  }

  if (!scriptURL) {
    return null;
  }

  return extractHostname(scriptURL);
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
const API_URL = normalizeAndroidLocalhost(
  ensureApiBasePath(envApiUrl || buildDefaultApiUrl()),
);

const getHostAndPort = (url: string): { host: string; port: string } | null => {
  const normalized = url.includes('://') ? url : `http://${url}`;
  const withoutProtocol = normalized.split('://')[1] || '';
  const hostAndPath = withoutProtocol.split('/')[0] || '';
  if (!hostAndPath) {
    return null;
  }

  const [host, port = ''] = hostAndPath.split(':');
  if (!host) {
    return null;
  }

  return { host, port };
};

const getApiOrigin = (): string | null => {
  const match = API_URL.match(/^(https?:\/\/[^/]+)/i);
  return match?.[1] ?? null;
};

export const resolveMediaUrl = (value?: string | null): string | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  const apiOrigin = getApiOrigin();
  if (trimmed.startsWith('/')) {
    return apiOrigin ? `${apiOrigin}${trimmed}` : trimmed;
  }

  const currentHostAndPort = getHostAndPort(trimmed);
  const apiHostAndPort = getHostAndPort(API_URL);

  if (currentHostAndPort && apiHostAndPort) {
    const isLoopbackHost =
      currentHostAndPort.host === 'localhost' ||
      currentHostAndPort.host === '127.0.0.1' ||
      currentHostAndPort.host === '10.0.2.2';

    if (isLoopbackHost && currentHostAndPort.host !== apiHostAndPort.host) {
      const targetPort = apiHostAndPort.port || currentHostAndPort.port;
      const hostWithPort = targetPort
        ? `${apiHostAndPort.host}:${targetPort}`
        : apiHostAndPort.host;

      return trimmed.replace(
        /^([a-z]+:\/\/)([^/]+)/i,
        `$1${hostWithPort}`,
      );
    }
  }

  if (trimmed.startsWith('uploads/')) {
    return apiOrigin ? `${apiOrigin}/${trimmed}` : `/${trimmed}`;
  }

  return trimmed;
};

console.log('[API] Using base URL:', API_URL);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Render free instances can take longer on cold start
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - backend may be cold starting');
      error.message = `Request timeout while connecting to API at ${API_URL}. If using Render free tier, wait a moment and retry.`;
      return Promise.reject(error);
    }

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
