import apiClient from './apiClient';
import type { UserResource } from '@clerk/types';
import type { User } from '../types';

interface UserResponse {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export const userService = {
  // Only called after successful Clerk signup in development
  handleNewUserSignup: async (userId: string) => {
    if (import.meta.env.DEV && userId) {
      try {
        const response = await apiClient.post<UserResponse>('/users/dev/sync', {
          id: userId
        });
        return response.data;
      } catch (error) {
        console.error('Failed to sync new user with backend:', error);
      }
    }
  },

  syncUserWithBackend: async (user: UserResource) => {
    if (import.meta.env.DEV && user) {
      try {
        const response = await apiClient.post<UserResponse>('/users/dev/sync', {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress
        });
        return response.data;
      } catch (error: any) {
        throw error;
      }
    }
  },

  getUserById: async (userId: string): Promise<User> => {
    try {
      const response = await apiClient.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  },

  updateUsername: async (userId: string, username: string) => {
    try {
      const response = await apiClient.put<UserResponse>(`/users/${userId}`, {
        username
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update username:', error);
      throw error;
    }
  },

  getActiveUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<User[]>('/users/active');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      throw error;
    }
  }
}; 