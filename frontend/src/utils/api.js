import axios from 'axios';

// In production (Vercel), REACT_APP_API_URL must be set to your backend URL e.g. https://your-api.onrender.com
// In development, leave it unset and the CRA proxy (package.json "proxy") handles /api → localhost:5000
const baseURL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
