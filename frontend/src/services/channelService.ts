import { useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { logger } from '../utils/logger';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const fetchChannels = async (): Promise<Channel[]> => {
  logger.debug('api', 'Fetching channels');
  const response = await apiClient.get('/channels');
  return response.data;
};

export const useChannels = () => {
  return useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannels,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};