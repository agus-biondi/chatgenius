import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { webSocketManager } from '../../services/websocket/WebSocketManager';
import { MessageDTO } from '../../types';
import { logger } from '../../utils/logger';

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
  const { getToken } = useAuth();
  const isSettingUp = useRef(false);

  const setupWebSocket = useCallback(async () => {
    if (isSettingUp.current) {
      logger.debug('state', 'WebSocket setup already in progress');
      return;
    }

    isSettingUp.current = true;
    try {
      const token = await getToken();
      if (!token) {
        logger.error('state', 'No authentication token available');
        return;
      }

      logger.info('state', 'Setting up WebSocket connection', { 
        channelId,
        hasToken: !!token 
      });

      await webSocketManager.connect(token);
      
      logger.debug('state', 'Subscribing to channel', { channelId });
      await webSocketManager.subscribeToChannel(
        channelId,
        (message) => {
          logger.debug('state', 'Received message', { channelId, messageId: message.id });
          onMessage(message);
        },
        onTyping ? (username) => {
          logger.debug('state', 'Received typing event', { channelId, username });
          onTyping(username);
        } : undefined
      );
    } catch (error) {
      logger.error('state', 'Failed to setup WebSocket connection', { 
        channelId, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      isSettingUp.current = false;
    }
  }, [channelId, getToken, onMessage, onTyping]);

  useEffect(() => {
    if (!enabled || !channelId) {
      logger.debug('state', 'WebSocket subscription disabled or no channelId', { enabled, channelId });
      return;
    }

    logger.debug('state', 'Setting up WebSocket subscription', { channelId });
    setupWebSocket();

    return () => {
      logger.debug('state', 'Cleaning up WebSocket subscription', { channelId });
      webSocketManager.unsubscribeFromChannel(channelId).catch((error) => {
        logger.error('state', 'Failed to unsubscribe from channel', { 
          channelId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    };
  }, [channelId, enabled, setupWebSocket]);

  return {
    sendMessage: useCallback((content: string) => {
      logger.debug('state', 'Sending message', { channelId, content });
      return webSocketManager.sendMessage(channelId, content);
    }, [channelId]),
    sendTypingEvent: useCallback(() => {
      logger.debug('state', 'Sending typing event', { channelId });
      return webSocketManager.sendTypingEvent(channelId);
    }, [channelId]),
  };
} 