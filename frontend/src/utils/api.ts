import axios from 'axios';

 
const API_URL = ((import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
