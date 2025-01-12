import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { webSocketManager } from '../../services/websocket/WebSocketManager';
import { logger } from '../../utils/logger';

export const useWebSocketConnection = () => {
  const { getToken, isSignedIn } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    let reconnectTimeout: NodeJS.Timeout;

    const handleConnect = () => {
      if (isSubscribed) {
        logger.debug('state', 'WebSocket connected');
        setIsConnected(true);
      }
    };

    const handleDisconnect = () => {
      if (isSubscribed) {
        logger.debug('state', 'WebSocket disconnected');
        setIsConnected(false);
      }
    };

    const connectWebSocket = async () => {
      if (!isSignedIn) {
        logger.debug('state', 'User not signed in, skipping connection');
        return;
      }

      try {
        const token = await getToken();
        if (!token || !isSubscribed) return;

        logger.debug('state', 'Connecting to WebSocket');
        await webSocketManager.connect(token);
      } catch (error) {
        logger.error('state', 'Failed to connect to WebSocket', error);
        if (isSubscribed) {
          setIsConnected(false);
        }
      }
    };

    // Add event listeners
    webSocketManager.onConnect(handleConnect);
    webSocketManager.onDisconnect(handleDisconnect);

    // Initial connection
    connectWebSocket();

    // Cleanup
    return () => {
      isSubscribed = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      webSocketManager.offConnect(handleConnect);
      webSocketManager.offDisconnect(handleDisconnect);
      webSocketManager.disconnect();
      setIsConnected(false);
    };
  }, [getToken, isSignedIn]);

  return { isConnected };
}; 