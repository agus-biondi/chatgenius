import api from './api';
import { Message, CreateMessageRequest } from '../types';

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
}

export const messageService = {
    async getChannelMessages(channelId: string, page = 0, size = 20) {
        const response = await api.get<PageResponse<Message>>(`/messages/channel/${channelId}`, {
            params: { page, size }
        });
        return response.data.content;
    },

    async createMessage(request: CreateMessageRequest) {
        const response = await api.post<Message>('/messages', request);
        return response.data;
    },

    async getThreadMessages(parentMessageId: string, page = 0, size = 20) {
        const response = await api.get<PageResponse<Message>>(`/messages/thread/${parentMessageId}`, {
            params: { page, size }
        });
        return response.data.content;
    },

    async updateMessage(messageId: string, request: CreateMessageRequest) {
        const response = await api.put<Message>(`/messages/${messageId}`, request);
        return response.data;
    },

    async deleteMessage(messageId: string) {
        await api.delete(`/messages/${messageId}`);
    },

    async searchMessages(channelId: string, query: string, page = 0, size = 20) {
        const response = await api.get<PageResponse<Message>>('/messages/search', {
            params: { channelId, query, page, size }
        });
        return response.data.content;
    }
}; 