import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Adjust if backend URL is different
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized and 403 Forbidden
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
