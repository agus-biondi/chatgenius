import api from './api';
import { Reaction } from '../types';

class ReactionService {
    async addReaction(messageId: string, emoji: string): Promise<Reaction> {
        const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
        return response.data;
    }

    async removeReaction(messageId: string, reactionId: string): Promise<void> {
        await api.delete(`/messages/${messageId}/reactions/${reactionId}`);
    }
}

export const reactionService = new ReactionService(); 