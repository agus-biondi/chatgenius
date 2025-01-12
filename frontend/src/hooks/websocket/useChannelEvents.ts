import { useEffect, useCallback } from 'react';
import { Channel } from '../../types';
import { webSocketManager } from '../../services/websocket/WebSocketManager';
import { logger } from '../../utils/logger';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  const handleChannelEvent = useCallback((event: ChannelEvent) => {
    logger.debug('state', 'Received channel event', { type: event.type, channelId: event.channel.id });
    
    // Get all channel-related queries that need to be updated
    const queryKeys = [
      ['channels', 'public'],
      ['channels', 'user'],
      ['channels', 'available']
    ];

    switch (event.type) {
      case 'CREATED': {
        // Silently update the cache without triggering a refetch
        queryKeys.forEach(queryKey => {
          queryClient.setQueryData(queryKey, (old: Channel[] | undefined) => {
            if (!old) return [event.channel];
            if (old.some(ch => ch.id === event.channel.id)) return old;
            return [...old, event.channel];
          });
        });

        onChannelCreated?.(event.channel);
        break;
      }
      case 'DELETED': {
        // Silently update the cache without triggering a refetch
        queryKeys.forEach(queryKey => {
          queryClient.setQueryData(queryKey, (old: Channel[] | undefined) => {
            if (!old) return [];
            return old.filter(channel => channel.id !== event.channel.id);
          });
        });

        onChannelDeleted?.(event.channel);
        break;
      }
      default:
        logger.warn('state', 'Unknown channel event type', { type: event.type });
    }
  }, [onChannelCreated, onChannelDeleted, queryClient]);

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