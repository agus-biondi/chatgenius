import { useEffect, useCallback } from 'react';
import { Channel } from '../../types';
import { webSocketManager } from '../../services/websocket/WebSocketManager';
import { logger } from '../../utils/logger';
import { useWebSocketConnection } from './useWebSocketConnection';

type ChannelEvent = {
  type: 'CREATED' | 'DELETED' | 'UPDATED';
  channel: Channel;
};

interface UseChannelEventsProps {
  onChannelCreated?: (channel: Channel) => void;
  onChannelDeleted?: (channel: Channel) => void;
  onChannelUpdated?: (channel: Channel) => void;
}

export function useChannelEvents({
  onChannelCreated,
  onChannelDeleted,
  onChannelUpdated
}: UseChannelEventsProps = {}) {
  const { isConnected } = useWebSocketConnection();

  const handleChannelEvent = useCallback((event: ChannelEvent) => {
    logger.debug('state', 'Handling channel event', { type: event.type, channelId: event.channel.id });

    switch (event.type) {
      case 'CREATED':
        onChannelCreated?.(event.channel);
        break;
      case 'DELETED':
        onChannelDeleted?.(event.channel);
        break;
      case 'UPDATED':
        onChannelUpdated?.(event.channel);
        break;
      default:
        logger.warn('state', 'Unknown channel event type', event);
    }
  }, [onChannelCreated, onChannelDeleted, onChannelUpdated]);

  useEffect(() => {
    if (!isConnected) {
      logger.debug('state', 'WebSocket not connected, skipping channel events subscription');
      return;
    }

    logger.debug('state', 'Setting up channel events subscription');
    webSocketManager.addChannelEventHandler(handleChannelEvent);

    return () => {
      logger.debug('state', 'Cleaning up channel events subscription');
      webSocketManager.removeChannelEventHandler(handleChannelEvent);
    };
  }, [isConnected, handleChannelEvent]);
} 