import { useEffect, useCallback } from 'react';
import { Channel } from '../../types';
import { webSocketManager } from '../../services/websocket/WebSocketManager';
import { logger } from '../../utils/logger';
import { useWebSocketConnection } from './useWebSocketConnection';

interface ChannelEvent {
  type: 'CREATED' | 'DELETED';
  channel: Channel;
}

interface UseChannelEventsOptions {
  onChannelCreated?: (channel: Channel) => void;
  onChannelDeleted?: (channel: Channel) => void;
  enabled?: boolean;
}

export function useChannelEvents({
  onChannelCreated,
  onChannelDeleted,
  enabled = true,
}: UseChannelEventsOptions = {}) {
  const { isConnected } = useWebSocketConnection();

  const handleChannelEvent = useCallback((event: ChannelEvent) => {
    logger.debug('state', 'Received channel event', { type: event.type, channelId: event.channel.id });
    
    switch (event.type) {
      case 'CREATED':
        onChannelCreated?.(event.channel);
        break;
      case 'DELETED':
        onChannelDeleted?.(event.channel);
        break;
      default:
        logger.warn('state', 'Unknown channel event type', { type: event.type });
    }
  }, [onChannelCreated, onChannelDeleted]);

  useEffect(() => {
    if (!enabled || !isConnected) {
      logger.debug('state', 'Channel events subscription disabled or not connected', { enabled, isConnected });
      return;
    }

    const setupSubscription = async () => {
      try {
        await webSocketManager.subscribeToChannelEvents(handleChannelEvent);
      } catch (error) {
        logger.error('state', 'Failed to setup channel events subscription', { 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    setupSubscription();

    return () => {
      logger.debug('state', 'Cleaning up channel events subscription');
      webSocketManager.unsubscribeFromChannelEvents(handleChannelEvent).catch((error) => {
        logger.error('state', 'Failed to unsubscribe from channel events', { 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    };
  }, [enabled, isConnected, handleChannelEvent]);
} 