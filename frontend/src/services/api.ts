import axios, { AxiosResponse, AxiosError } from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for auth token
api.interceptors.request.use(async (config) => {
    console.log('Request interceptor - getting token...');
    const token = await window.Clerk?.session?.getToken();
    console.log('Token present:', !!token);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added Authorization header');
    } else {
        console.warn('No token available');
    }
    return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            window.location.href = '/sign-in';
        }
        return Promise.reject(error);
    }
);

export default api; 