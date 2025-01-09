import apiClient from './apiClient';
import type { UserResource } from '@clerk/types';

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
      } catch (error) {
        console.info('Failed to sync user with backend:', error);
      }
    }
  }
}; 