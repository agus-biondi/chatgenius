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
    try {
        // Wait for Clerk to be initialized
        while (!window.Clerk?.session) {
            console.log('Waiting for Clerk session to be available...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const token = await window.Clerk.session.getToken();
        console.log('Token present:', !!token);
        
        if (!token) {
            throw new Error('No authentication token available');
        }
        
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added Authorization header');
        return config;
    } catch (error) {
        console.error('Error in request interceptor:', error);
        return Promise.reject(error);
    }
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            console.log('Unauthorized request, redirecting to sign-in...');
            window.location.href = '/sign-in';
        }
        return Promise.reject(error);
    }
);

export default api; 