import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactionDTO } from '../../types';
import { webSocketManager } from '../../services/websocket/WebSocketManager';
import { addReaction, removeReaction, getReactionsForMessages } from '../../services/apiClient';
import { logger } from '../../utils/logger';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useAuth } from '@clerk/clerk-react';

interface UseMessageReactionsOptions {
    messageIds: string[];
    enabled?: boolean;
}

export function useMessageReactions({ messageIds, enabled = true }: UseMessageReactionsOptions) {
    const [reactionsByMessageId, setReactionsByMessageId] = useState<Record<string, ReactionDTO[]>>({});
    const { isConnected } = useWebSocketConnection();
    const { getToken } = useAuth();
    const lastFetchedMessageIds = useRef<string[]>([]);
    const isMounted = useRef(true);

    // Memoize the fetchReactions function
    const fetchReactions = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token || !isMounted.current) return;

            lastFetchedMessageIds.current = messageIds;
            const fetchedReactions = await getReactionsForMessages(messageIds);
            
            if (isMounted.current) {
                setReactionsByMessageId(fetchedReactions);
            }
        } catch (error) {
            if (!isMounted.current) return;
            
            if ((error as any)?.response?.status === 401) {
                logger.debug('state', 'Authentication token expired, will retry after refresh');
                return;
            }
            logger.error('state', 'Failed to load reactions', { messageIds, error });
        }
    }, [messageIds, getToken]);

    // Memoize the handleAddReaction function
    const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
        try {
            const reaction = await addReaction(messageId, emoji);
            setReactionsByMessageId(prev => ({
                ...prev,
                [messageId]: [
                    ...(prev[messageId] || []).filter(r => !(r.userId === reaction.userId && r.emoji === emoji)),
                    reaction
                ]
            }));
        } catch (error) {
            logger.error('state', 'Failed to add reaction', { messageId, emoji, error });
        }
    }, []);

    // Memoize the handleRemoveReaction function
    const handleRemoveReaction = useCallback(async (messageId: string, emoji: string) => {
        try {
            await removeReaction(messageId, emoji);
            setReactionsByMessageId(prev => ({
                ...prev,
                [messageId]: (prev[messageId] || []).filter(r => r.emoji !== emoji)
            }));
        } catch (error) {
            logger.error('state', 'Failed to remove reaction', { messageId, emoji, error });
        }
    }, []);

    // Effect to fetch initial reactions
    useEffect(() => {
        if (!enabled || !messageIds.length) return;
        
        const shouldFetch = messageIds.some(id => !lastFetchedMessageIds.current.includes(id));
        if (!shouldFetch) return;

        fetchReactions();
    }, [enabled, messageIds, fetchReactions]);

    // Handle reaction updates
    const handleReactionUpdate = useCallback((messageId: string, reactions: ReactionDTO[]) => {
        if (!isMounted.current) return;
        if (messageIds.includes(messageId)) {
            setReactionsByMessageId(prev => ({
                ...prev,
                [messageId]: reactions
            }));
        }
    }, [messageIds]);

    // Subscribe to reaction updates
    useEffect(() => {
        if (!enabled || !isConnected) return;

        webSocketManager.addReactionHandler(handleReactionUpdate);

        return () => {
            webSocketManager.removeReactionHandler(handleReactionUpdate);
        };
    }, [enabled, isConnected, handleReactionUpdate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return {
        reactionsByMessageId,
        addReaction: handleAddReaction,
        removeReaction: handleRemoveReaction
    };
} 