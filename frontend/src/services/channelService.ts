import api from './api';
import { Channel, CreateChannelRequest } from '../types/index';

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
}

export const channelService = {
    async getChannels(page = 0, size = 20) {
        console.log('Calling getChannels with page:', page, 'size:', size);
        try {
            const response = await api.get<PageResponse<Channel>>('/channels', { params: { page, size } });
            console.log('getChannels response:', response);
            return response.data.content;
        } catch (error) {
            console.error('getChannels error:', error);
            throw error;
        }
    },

    async createChannel(request: CreateChannelRequest) {
        const response = await api.post<Channel>('/channels', request);
        return response.data;
    },

    async getChannel(channelId: string) {
        const response = await api.get<Channel>(`/channels/${channelId}`);
        return response.data;
    },

    async deleteChannel(channelId: string) {
        await api.delete(`/channels/${channelId}`);
    }
}; 