import { User } from '../types';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

class UserService {
    async getActiveUsers(): Promise<User[]> {
        const response = await api.get('/users/active');
        return response.data;
    }
}

export const userService = new UserService(); 