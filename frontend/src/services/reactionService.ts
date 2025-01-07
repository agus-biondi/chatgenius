import api from './api';
import { Reaction, CreateReactionRequest } from '../types';

//TODO auth
const TEST_USER = "test_11111111-1111-1111-1111-111111111111";

export const reactionService = {
    async addReaction(messageId: string, request: CreateReactionRequest) {
        await api.post(
            `/messages/${messageId}/reactions`, 
            request,
            {
                headers: {
                    'X-User-ID': TEST_USER
                }
            }
        );
    },

    async removeReaction(messageId: string, reactionId: string) {
        await api.delete(`/messages/${messageId}/reactions/${reactionId}`, {
            headers: {
                'X-User-ID': TEST_USER
            }
        });
    },

    async getMessageReactions(messageId: string) {
        const response = await api.get<Reaction[]>(`/messages/${messageId}/reactions`, {
            headers: {
                'X-User-ID': TEST_USER
            }
        });
        return response.data;
    }
}; 