import axios from 'axios';

// Test user ID from backend
const TEST_USER_ID = 'test_11111111-1111-1111-1111-111111111111';

// Create axios instance with default config
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
        'X-User-ID': TEST_USER_ID
    }
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        // Handle common errors here (401, 403, etc.)
        if (error.response) {
            console.error('API Error:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default api; 