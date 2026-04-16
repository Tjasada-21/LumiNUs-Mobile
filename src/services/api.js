import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your computer's actual IPv4 address
// Since you are using Docker/Sail, DO NOT add a port number.
const LOCAL_IP = '192.168.1.31'; 

const api = axios.create({
  baseURL: `http://${LOCAL_IP}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;