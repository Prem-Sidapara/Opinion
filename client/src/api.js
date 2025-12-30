import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

console.log('🔌 API Base URL:', api.defaults.baseURL); // DEBUG LOG

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid/expired
            console.warn('Received 401, clearing token and reloading...');
            localStorage.removeItem('token');
            // Optional: Redirect to login or just reload to trigger AuthContext guest login
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
