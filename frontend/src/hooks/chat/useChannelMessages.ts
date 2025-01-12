import { useCallback } from 'react';
import { useWebSocketSubscription } from '../websocket/useWebSocketSubscription';
import { MessageDTO } from '../../types';
import { logger } from '../../utils/logger';
import { useQueryClient } from '@tanstack/react-query';

interface UseChannelMessagesOptions {
  channelId: string;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useChannelMessages({ channelId, onError, enabled = true }: UseChannelMessagesOptions) {
  const queryClient = useQueryClient();

  const handleMessage = useCallback((message: MessageDTO) => {
    logger.debug('state', 'Received message', { channelId, messageId: message.id });

    // Update the messages query cache
    queryClient.setQueryData(['messages', channelId, 'parents'], (old: any) => {
      if (!old) return { content: [message], totalPages: 1, totalElements: 1, size: 20, number: 0 };

      // Create a new array with the new message
      const updatedContent = [...old.content, message];

      // No need to sort since backend sends messages in correct order
      logger.debug('state', 'Updated messages array', { 
        messageCount: updatedContent.length,
        latestMessageId: message.id,
        latestMessageTimestamp: message.createdAt
      });

      return {
        ...old,
        content: updatedContent,
        totalElements: old.totalElements + 1
      };
    });
  }, [channelId, queryClient]);

  const { sendMessage } = useWebSocketSubscription({
    channelId,
    onMessage: handleMessage,
    enabled: enabled && !!channelId,
  });

  return {
    sendMessage,
  };
} 