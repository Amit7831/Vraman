/**
 * services/api.js
 *
 * BUG FIX: Removed hardcoded 'Content-Type: application/json' default header.
 * When FormData is passed to axios, it automatically sets multipart/form-data
 * with the correct boundary. The old hardcoded header was overriding this,
 * causing multer to never parse uploaded files on the backend.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  // FIX: NO default Content-Type — axios sets it correctly per request:
  //   JSON body   → application/json       (automatic)
  //   FormData    → multipart/form-data    (automatic, with boundary)
  timeout: 30000, // increased to 30s for file uploads
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vraman_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 without redirect loop on /login itself
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vraman_token');
      localStorage.removeItem('vraman_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
