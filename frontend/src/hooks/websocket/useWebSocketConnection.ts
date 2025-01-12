import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { webSocketManager } from '../../services/websocket/WebSocketManager';
import { logger } from '../../utils/logger';

export function useWebSocketConnection() {
  const { getToken } = useAuth();
  const isConnecting = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const connected = webSocketManager.isConnected();
      setIsConnected(connected);
    };

    const setupConnection = async () => {
      if (isConnecting.current) {
        logger.debug('state', 'WebSocket connection setup already in progress');
        return;
      }

      isConnecting.current = true;
      try {
        const token = await getToken();
        if (!token) {
          logger.error('state', 'No authentication token available');
          return;
        }

        logger.info('state', 'Setting up WebSocket connection');
        await webSocketManager.connect(token);
        checkConnection();
      } catch (error) {
        logger.error('state', 'Failed to setup WebSocket connection', { 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        isConnecting.current = false;
      }
    };

    // Check connection immediately and set up periodic checks
    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    setupConnection();

    return () => {
      clearInterval(interval);
      logger.debug('state', 'Cleaning up WebSocket connection');
      webSocketManager.disconnect();
    };
  }, [getToken]);

  return { isConnected };
} 