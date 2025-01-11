import { useState, useCallback } from 'react';
import { useWebSocketSubscription } from '../websocket/useWebSocketSubscription';
import { MessageDTO } from '../../types';
import { logger } from '../../utils/logger';

interface UseChannelMessagesOptions {
  channelId: string;
  onError?: (error: Error) => void;
}

export function useChannelMessages({ channelId, onError }: UseChannelMessagesOptions) {
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleMessage = useCallback((message: MessageDTO) => {
    setMessages(prev => [...prev, message]);
    setIsLoading(false);
  }, []);

  const { sendMessage, sendTypingEvent } = useWebSocketSubscription({
    channelId,
    onMessage: handleMessage,
    enabled: !!channelId,
  });

  return {
    messages,
    isLoading,
    sendMessage,
    sendTypingEvent
  };
} 