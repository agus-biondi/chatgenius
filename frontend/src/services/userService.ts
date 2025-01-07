import { User } from '../types';
import axios from 'axios';

// Test user ID from backend
const TEST_USER_ID = 'test_11111111-1111-1111-1111-111111111111';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
        'X-User-ID': TEST_USER_ID
    }
});

class UserService {
    async getActiveUsers(): Promise<User[]> {
        const response = await api.get('/users/active');
        return response.data;
    }
}

export const userService = new UserService(); 