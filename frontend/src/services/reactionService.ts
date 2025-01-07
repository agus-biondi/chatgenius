import api from './api';
import { Reaction, CreateReactionRequest } from '../types';

export const reactionService = {
    async addReaction(messageId: string, request: CreateReactionRequest) {
        const response = await api.post<Reaction>(`/messages/${messageId}/reactions`, request);
        return response.data;
    },

    async removeReaction(messageId: string, reactionId: string) {
        await api.delete(`/messages/${messageId}/reactions/${reactionId}`);
    },

    async getMessageReactions(messageId: string) {
        const response = await api.get<Reaction[]>(`/messages/${messageId}/reactions`);
        return response.data;
    }
}; 