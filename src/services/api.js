import axios from 'axios';

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

export default api;