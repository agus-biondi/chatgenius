import { useEffect, useCallback, useRef } from 'react';
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
  const isSettingUp = useRef(false);

  const setupWebSocket = useCallback(async () => {
    if (isSettingUp.current) {
      logger.debug('state', 'WebSocket subscription setup already in progress');
      return;
    }

    isSettingUp.current = true;
    try {
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
      logger.error('state', 'Failed to setup WebSocket subscription', { 
        channelId, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      isSettingUp.current = false;
    }
  }, [channelId, onMessage, onTyping]);

  useEffect(() => {
    if (!enabled || !channelId || !isConnected) {
      logger.debug('state', 'WebSocket subscription disabled, no channelId, or not connected', { 
        enabled, 
        channelId,
        isConnected 
      });
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
  }, [channelId, enabled, isConnected, setupWebSocket]);

  return {
    sendMessage: useCallback(async (content: string) => {
      if (!isConnected) {
        logger.warn('state', 'Cannot send message - WebSocket not connected');
        return;
      }
      logger.debug('state', 'Sending message', { channelId, content });
      return webSocketManager.sendMessage(channelId, content);
    }, [channelId, isConnected]),
    sendTypingEvent: useCallback(async () => {
      if (!isConnected) {
        logger.warn('state', 'Cannot send typing event - WebSocket not connected');
        return;
      }
      logger.debug('state', 'Sending typing event', { channelId });
      return webSocketManager.sendTypingEvent(channelId);
    }, [channelId, isConnected]),
  };
} 