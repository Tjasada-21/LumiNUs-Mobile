import axios from 'axios';
import { clearAuthCredentials, getAuthToken, peekAuthToken } from './authStorage';

// Replace with your computer's actual IPv4 address when testing on a device.
// Sail exposes the Laravel app on host port 8000 in this workspace.
const LOCAL_IP = '192.168.254.104';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || `http://${LOCAL_IP}:8000/api`;

// const api = axios.create({
//   // 👑 Paste the Ngrok link here. MAKE SURE you keep the /api at the very end!
//   baseURL: 'https://rosy-stash-aneurism.ngrok-free.dev/api',
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   },
// });

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
}); 

api.interceptors.request.use(async (config) => {
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