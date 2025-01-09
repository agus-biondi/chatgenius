import apiClient from './apiClient';
import type { UserResource } from '@clerk/types';

export const userService = {
  // Only called after successful Clerk signup in development
  handleNewUserSignup: async (userId: string) => {
    if (import.meta.env.DEV && userId) {
      try {
        await apiClient.post('/users/dev/sync', {
          id: userId
        });
      } catch (error) {
        console.error('Failed to sync new user with backend:', error);
      }
    }
  },

  syncUserWithBackend: async (user: UserResource) => {
    if (import.meta.env.DEV && user) {
      try {
        await apiClient.post('/users/dev/sync', {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress
        });
      } catch (error) {
        console.error('Failed to sync user with backend:', error);
      }
    }
  }
}; 