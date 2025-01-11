import { useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { User } from './userService';
import { logger } from '../utils/logger';

export interface Message {
  id: string;
  content: string;
  channelId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export const fetchMessages = async (channelId: string): Promise<Message[]> => {
  logger.debug('api', `Fetching messages for channel ${channelId}`);
  const response = await apiClient.get(`/channels/${channelId}/messages`);
  return response.data;
};

export const useMessages = (channelId: string) => {
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => fetchMessages(channelId),
    staleTime: 1000 * 5 * 60,
    refetchOnWindowFocus: false,
    enabled: !!channelId,
  });
}; 