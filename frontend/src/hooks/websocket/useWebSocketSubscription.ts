import { useEffect, useCallback } from 'react';
import { webSocketManager } from '../../services/websocket/WebSocketManager';
import { MessageDTO } from '../../types';
import { logger } from '../../utils/logger';
import { useWebSocketConnection } from './useWebSocketConnection';

interface UseWebSocketSubscriptionOptions {
  channelId: string;
  onMessage: (message: MessageDTO) => void;
  onTyping?: (username: string) => void;
  enabled?: boolean;
}

export function useWebSocketSubscription({
  channelId,
  onMessage,
  onTyping,
  enabled = true,
}: UseWebSocketSubscriptionOptions) {
  const { isConnected } = useWebSocketConnection();

  // Filter messages for this channel
  const handleMessage = useCallback((message: MessageDTO) => {
    if (message.channelId === channelId) {
      onMessage(message);
    }
  }, [channelId, onMessage]);

  // Filter typing events for this channel
  const handlePresence = useCallback((presenceChannelId: string, userId: string) => {
    if (presenceChannelId === channelId && onTyping) {
      onTyping(userId);
    }
  }, [channelId, onTyping]);

  useEffect(() => {
    if (!enabled || !channelId || !isConnected) {
      logger.debug('state', 'WebSocket subscription not enabled', { 
        channelId,
        isConnected 
      });
      return;
    }

    logger.debug('state', 'Setting up WebSocket subscription', { channelId });
    
    // Add handlers
    webSocketManager.addMessageHandler(handleMessage);
    if (onTyping) {
      webSocketManager.addPresenceHandler(handlePresence);
    }

    return () => {
      logger.debug('state', 'Cleaning up WebSocket subscription', { channelId });
      webSocketManager.removeMessageHandler(handleMessage);
      if (onTyping) {
        webSocketManager.removePresenceHandler(handlePresence);
      }
    };
  }, [channelId, enabled, isConnected, handleMessage, handlePresence, onTyping]);

  return {
    sendMessage: useCallback(async (content: string) => {
      if (!isConnected) {
        logger.warn('state', 'Cannot send message - WebSocket not connected');
        return;
      }
      logger.debug('state', 'Sending message', { channelId, content });
      return webSocketManager.sendMessage(channelId, content);
    }, [channelId, isConnected]),
  };
} 