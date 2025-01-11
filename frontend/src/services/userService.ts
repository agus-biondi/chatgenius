// src/services/userService.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  handleNewUserSignup: async (userId: string, email: string) => {
    logger.debug('api', 'Syncing new user with backend:', { userId, email });
    try {
      const response = await apiClient.post('/users/dev/sync', {
        id: userId,
        email
      });
      if (!response.data) {
        throw new Error('Failed to create user on the backend');
      }
      logger.debug('api', 'Successfully synced user with backend');
    } catch (error) {
      logger.error('api', 'Error in handleNewUserSignup:', error);
      throw error;
    }
  },
};

export const fetchUsers = async (): Promise<User[]> => {
  logger.debug('api', 'Fetching users');
  const response = await apiClient.get('/users');
  return response.data;
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
  