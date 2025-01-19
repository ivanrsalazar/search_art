// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api/', // Adjust if needed
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token automatically (if available)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// (Optional) You can also export a hook version if you need it
export const useAxiosInterceptors = (navigate) => {
    axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('username');
                navigate('/login');
            }
            return Promise.reject(error);
        }
    );
};

// Export as the default export
export default axiosInstance;