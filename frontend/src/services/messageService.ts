import api from './api';
import { Message, CreateMessageRequest } from '../types';

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
}

//TODO auth
const TEST_USER = "test_11111111-1111-1111-1111-111111111111";

export const messageService = {
    async getChannelMessages(channelId: string, page = 0, size = 20) {
        const response = await api.get<PageResponse<Message>>(`/messages/channel/${channelId}`, {
            params: { page, size },
            headers: {
                'X-User-ID': TEST_USER
            }
        });
        return response.data.content;
    },

    async createMessage(request: CreateMessageRequest) {
        await api.post('/messages', request, {
            headers: {
                'X-User-ID': TEST_USER
            }
        });
    },

    async getThreadMessages(parentMessageId: string, page = 0, size = 20) {
        const response = await api.get<PageResponse<Message>>(`/messages/thread/${parentMessageId}`, {
            params: { page, size },
            headers: {
                'X-User-ID': TEST_USER
            }
        });
        return response.data.content;
    },

    async updateMessage(messageId: string, request: CreateMessageRequest) {
        const response = await api.put<Message>(`/messages/${messageId}`, request, {
            headers: {
                'X-User-ID': TEST_USER
            }
        });
        return response.data;
    },

    async deleteMessage(messageId: string) {
        await api.delete(`/messages/${messageId}`, {
            headers: {
                'X-User-ID': TEST_USER
            }
        });
    },

    async searchMessages(channelId: string, query: string, page = 0, size = 20) {
        const response = await api.get<PageResponse<Message>>('/messages/search', {
            params: { channelId, query, page, size },
            headers: {
                'X-User-ID': TEST_USER
            }
        });
        return response.data.content;
    }
}; 