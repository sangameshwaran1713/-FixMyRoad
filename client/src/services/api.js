import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for generic error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const responseData = error.response?.data || {};
    const message = responseData.detail || responseData.message || error.message || 'Something went wrong';
    
    const errObj = new Error(message);
    if (responseData.requiresVerification) {
      errObj.requiresVerification = true;
      errObj.email = responseData.email;
    }
    return Promise.reject(errObj);
  }
);

export const checkHealth = async () => {
  return await api.get('/health');
};

export default api;
