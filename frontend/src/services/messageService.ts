import { useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { logger } from '../utils/logger';
import { MessageDTO } from '../types';

export interface Message {
  id: string;
  content: string;
  channelId: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  isEdited: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const fetchLatestParentMessages = async (channelId: string): Promise<PageResponse<MessageDTO>> => {
  logger.debug('api', `Fetching latest parent messages for channel ${channelId}`);
  const response = await apiClient.get(`/channels/${channelId}/messages/parents`);
  return response.data;
};

export const useLatestParentMessages = (channelId: string) => {
  return useQuery<PageResponse<MessageDTO>>({
    queryKey: ['messages', channelId, 'parents'],
    queryFn: () => fetchLatestParentMessages(channelId),
    staleTime: 1000 * 5 * 60, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!channelId,
  });
};

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