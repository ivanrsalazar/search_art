// src/api/axiosConfig.js
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8014/api/', // Replace with your backend's base URL
    timeout: 5000, // Request timeout in milliseconds
});

// Request interceptor to attach the token to every request if available
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh or errors globally
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // You can add global error handling here
        return Promise.reject(error);
    }
);

export default axiosInstance;