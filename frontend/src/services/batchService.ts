import { useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';
import { Channel } from './channelService';
import { User } from './userService';
import { logger } from '../utils/logger';

interface BatchResponse {
  channels: Channel[];
  users: User[];
}

export const fetchChannelsAndUsers = async (): Promise<BatchResponse> => {
  logger.debug('api', 'Fetching channels and users in batch');
  const [channelsResponse, usersResponse] = await Promise.all([
    apiClient.get('/channels'),
    apiClient.get('/users'),
  ]);
  
  return {
    channels: channelsResponse.data,
    users: usersResponse.data,
  };
};

export const useChannelsAndUsers = () => {
  return useQuery({
    queryKey: ['channelsAndUsers'],
    queryFn: fetchChannelsAndUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}; 