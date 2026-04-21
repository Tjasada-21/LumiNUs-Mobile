import axios from 'axios';
import { clearAuthCredentials, getAuthToken } from './authStorage';

// Replace with your computer's actual IPv4 address
// Since you are using Docker/Sail, DO NOT add a port number.
const LOCAL_IP = '192.168.254.102'; 

const api = axios.create({
  baseURL: `http://${LOCAL_IP}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

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