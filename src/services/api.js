import axios from 'axios';
import { Platform } from 'react-native';
import { clearAuthCredentials, getAuthToken, peekAuthToken } from './authStorage';
import { getBaseUrlOverride } from './baseUrlOverride';

const normalizeApiBaseUrl = (url) => {
  const trimmed = String(url ?? '').trim();

  if (!trimmed) {
    return '';
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');

  return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
};

const ENV_API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const FALLBACK_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2/api',
  ios: 'http://localhost/api',
  default: 'http://localhost/api',
});
const API_BASE_URL = ENV_API_BASE_URL || FALLBACK_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
}); 

if (typeof console !== 'undefined' && __DEV__) {
  console.warn('[api] API_BASE_URL =', API_BASE_URL);
}

let apiBaseUrlRefreshPromise = null;

const refreshApiBaseUrl = async () => {
  const overrideUrl = normalizeApiBaseUrl(await getBaseUrlOverride());
  const nextBaseUrl = overrideUrl || API_BASE_URL;

  api.defaults.baseURL = nextBaseUrl;

  return nextBaseUrl;
};

const ensureApiBaseUrl = async () => {
  if (!apiBaseUrlRefreshPromise) {
    apiBaseUrlRefreshPromise = refreshApiBaseUrl();
  }

  return apiBaseUrlRefreshPromise;
};

export const applyBaseUrlOverride = async () => {
  apiBaseUrlRefreshPromise = null;
  return ensureApiBaseUrl();
};

export const apiReady = ensureApiBaseUrl();

api.interceptors.request.use(async (config) => {
  await ensureApiBaseUrl();

  if (config?.skipAuth) {
    return config;
  }

  const token = peekAuthToken() ?? await getAuthToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuthCredentials();
    }

    return Promise.reject(error);
  }
);

export default api;