import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import { logger } from '../utils/logger';
import { Channel, CreateChannelRequest } from '../types';

const CHANNELS_BASE_URL = '/channels';

export const channelService = {
  // Get all public channels
  getPublicChannels: async (): Promise<Channel[]> => {
    logger.debug('api', 'Fetching public channels');
    const response = await apiClient.get(`${CHANNELS_BASE_URL}/public`);
    return response.data;
  },

  // Get user's channels
  getUserChannels: async (): Promise<Channel[]> => {
    logger.debug('api', 'Fetching user channels');
    const response = await apiClient.get(`${CHANNELS_BASE_URL}/user`);
    return response.data;
  },

  // Get available channels (public + user's DMs)
  getAvailableChannels: async (): Promise<Channel[]> => {
    logger.debug('api', 'Fetching available channels');
    const response = await apiClient.get(`${CHANNELS_BASE_URL}/available`);
    return response.data;
  },

  // Get a single channel by ID
  getChannel: async (channelId: string): Promise<Channel> => {
    logger.debug('api', `Fetching channel ${channelId}`);
    const response = await apiClient.get(`${CHANNELS_BASE_URL}/${channelId}`);
    return response.data;
  },

  // Create a new channel
  createChannel: async (channelData: CreateChannelRequest): Promise<Channel> => {
    logger.debug('api', 'Creating new channel', channelData);
    const response = await apiClient.post(CHANNELS_BASE_URL, channelData);
    return response.data;
  },

  // Update a channel
  updateChannel: async (channelId: string, channelData: Partial<Channel>): Promise<Channel> => {
    logger.debug('api', `Updating channel ${channelId}`, channelData);
    const response = await apiClient.put(`${CHANNELS_BASE_URL}/${channelId}`, channelData);
    return response.data;
  },

  // Delete a channel
  deleteChannel: async (channelId: string): Promise<void> => {
    logger.debug('api', `Deleting channel ${channelId}`);
    await apiClient.delete(`${CHANNELS_BASE_URL}/${channelId}`);
  },

  // Join a channel
  joinChannel: async (channelId: string): Promise<void> => {
    logger.debug('api', `Joining channel ${channelId}`);
    await apiClient.post(`${CHANNELS_BASE_URL}/${channelId}/members`);
  },

  // Leave a channel
  leaveChannel: async (channelId: string): Promise<void> => {
    logger.debug('api', `Leaving channel ${channelId}`);
    await apiClient.delete(`${CHANNELS_BASE_URL}/${channelId}/members`);
  },

  // Get channel members
  getChannelMembers: async (channelId: string): Promise<Set<string>> => {
    logger.debug('api', `Fetching members for channel ${channelId}`);
    const response = await apiClient.get(`${CHANNELS_BASE_URL}/${channelId}/members`);
    return new Set(response.data);
  },

  // Check if user is member
  isUserMember: async (channelId: string, userId: string): Promise<boolean> => {
    logger.debug('api', `Checking if user ${userId} is member of channel ${channelId}`);
    const response = await apiClient.get(`${CHANNELS_BASE_URL}/${channelId}/members/${userId}`);
    return response.data;
  },

  // Create or get DM channel
  createOrGetDirectMessageChannel: async (otherUserId: string): Promise<Channel> => {
    logger.debug('api', `Creating/getting DM channel with user ${otherUserId}`);
    const response = await apiClient.post(`${CHANNELS_BASE_URL}/dm/${otherUserId}`);
    return response.data;
  }
};

// React Query hooks
export const usePublicChannels = () => {
  return useQuery({
    queryKey: ['channels', 'public'],
    queryFn: channelService.getPublicChannels,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserChannels = () => {
  return useQuery({
    queryKey: ['channels', 'user'],
    queryFn: channelService.getUserChannels,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAvailableChannels = () => {
  return useQuery({
    queryKey: ['channels', 'available'],
    queryFn: channelService.getAvailableChannels,
    staleTime: 5 * 60 * 1000,
  });
};

export const useChannel = (channelId: string) => {
  return useQuery({
    queryKey: ['channels', channelId],
    queryFn: () => channelService.getChannel(channelId),
    enabled: !!channelId,
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: channelService.createChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ channelId, data }: { channelId: string; data: Partial<Channel> }) =>
      channelService.updateChannel(channelId, data),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
};

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: channelService.deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
};

export const useJoinChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: channelService.joinChannel,
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
};

export const useLeaveChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: channelService.leaveChannel,
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
};

export const useChannelMembers = (channelId: string) => {
  return useQuery({
    queryKey: ['channels', channelId, 'members'],
    queryFn: () => channelService.getChannelMembers(channelId),
    enabled: !!channelId,
  });
};

export const useIsUserMember = (channelId: string, userId: string) => {
  return useQuery({
    queryKey: ['channels', channelId, 'members', userId],
    queryFn: () => channelService.isUserMember(channelId, userId),
    enabled: !!channelId && !!userId,
  });
};

export const useCreateOrGetDirectMessageChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: channelService.createOrGetDirectMessageChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
};