import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxied by Nginx to backend
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
        // Handle 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Don't redirect if it's a login attempt failure (invalid credentials)
            if (!error.config.url.includes('/auth/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                window.location.href = '/login';
            }
        }
        // 403 Forbidden shouldn't log out, just reject promise (UI can show error)
        if (error.response && error.response.status === 403) {
            console.error("Access forbidden (403)", error.config.url);
        }
        return Promise.reject(error);
    }
);

export const deleteBand = async (bandId: string) => {
    const response = await api.delete(`/bands/${bandId}`);
    return response.data;
};

export const uploadFile = async (file: File, type: 'image' | 'audio' | 'video' | 'file' = 'file') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/upload/${type}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data; // Returns filename/URL
};

export default api;
