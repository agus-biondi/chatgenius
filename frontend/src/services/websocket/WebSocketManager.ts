import { Client, IFrame } from '@stomp/stompjs';
import { logger } from '../../utils/logger';
import { ReactionDTO, MessageDTO, Channel } from '../../types';
import SockJS from 'sockjs-client';

type ChannelEvent = {
  type: 'CREATED' | 'DELETED' | 'UPDATED';
  channel: Channel;
};

type MessageHandler = (message: MessageDTO) => void;
type ReactionHandler = (messageId: string, reactions: ReactionDTO[]) => void;
type PresenceHandler = (channelId: string, userId: string) => void;
type ChannelEventHandler = (event: ChannelEvent) => void;

export class WebSocketManager {
  private static instance: WebSocketManager;
  private client: Client | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private connectListeners: (() => void)[] = [];
  private disconnectListeners: (() => void)[] = [];
  private authToken: string | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;

  private messageHandlers: Set<MessageHandler> = new Set();
  private reactionHandlers: Set<ReactionHandler> = new Set();
  private presenceHandlers: Set<PresenceHandler> = new Set();
  private channelEventHandlers: Set<ChannelEventHandler> = new Set();

  private constructor() {
    this.setupClient();
  }

  private setupClient() {
    if (this.client) {
      this.client.deactivate();
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: this.authToken ? {
        Authorization: `Bearer ${this.authToken}`
      } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        logger.debug('state', 'STOMP Debug:', str);
      }
    });

    this.client.onConnect = () => {
      logger.debug('state', 'WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.setupSubscriptions();
      this.notifyConnect();
    };

    this.client.onDisconnect = () => {
      logger.debug('state', 'WebSocket disconnected');
      this.isConnecting = false;
      this.notifyDisconnect();
      this.scheduleReconnect();
    };

    this.client.onStompError = (frame) => {
      logger.error('state', 'STOMP error', frame.body);
      this.isConnecting = false;
      this.notifyDisconnect();
      this.scheduleReconnect();
    };

    this.client.onWebSocketError = (event) => {
      logger.error('state', 'WebSocket error', event);
      this.isConnecting = false;
      this.notifyDisconnect();
      this.scheduleReconnect();
    };
  }

  private setupSubscriptions() {
    if (!this.client?.connected) {
      logger.warn('state', 'Cannot setup subscriptions - WebSocket not connected');
      return;
    }

    // Subscribe to messages
    this.client.subscribe('/topic/messages', (message) => {
      try {
        const messageData = JSON.parse(message.body) as MessageDTO;
        logger.debug('state', 'Received message', { messageId: messageData.id });
        this.messageHandlers.forEach(handler => handler(messageData));
      } catch (error) {
        logger.error('state', 'Failed to parse message', error);
      }
    }, {
      Authorization: `Bearer ${this.authToken}`
    });

    // Subscribe to reactions
    this.client.subscribe('/topic/reactions', (message) => {
      try {
        const { messageId, reactions } = JSON.parse(message.body);
        logger.debug('state', 'Received reactions update', { messageId });
        this.reactionHandlers.forEach(handler => handler(messageId, reactions));
      } catch (error) {
        logger.error('state', 'Failed to parse reactions update', error);
      }
    }, {
      Authorization: `Bearer ${this.authToken}`
    });

    // Subscribe to presence
    this.client.subscribe('/topic/presence', (message) => {
      try {
        const { channelId, userId } = JSON.parse(message.body);
        logger.debug('state', 'Received presence update', { channelId, userId });
        this.presenceHandlers.forEach(handler => handler(channelId, userId));
      } catch (error) {
        logger.error('state', 'Failed to parse presence update', error);
      }
    }, {
      Authorization: `Bearer ${this.authToken}`
    });

    // Subscribe to channel events
    this.client.subscribe('/topic/channels/events', (message) => {
      try {
        const event = JSON.parse(message.body) as ChannelEvent;
        logger.debug('state', 'Received channel event', { type: event.type, channelId: event.channel.id });
        this.channelEventHandlers.forEach(handler => handler(event));
      } catch (error) {
        logger.error('state', 'Failed to parse channel event', error);
      }
    }, {
      Authorization: `Bearer ${this.authToken}`
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('state', 'Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    logger.debug('state', `Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.authToken!).catch(error => {
        logger.error('state', 'Reconnection failed', error);
      });
    }, delay);
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  onConnect(listener: () => void) {
    this.connectListeners.push(listener);
  }

  offConnect(listener: () => void) {
    this.connectListeners = this.connectListeners.filter(l => l !== listener);
  }

  onDisconnect(listener: () => void) {
    this.disconnectListeners.push(listener);
  }

  offDisconnect(listener: () => void) {
    this.disconnectListeners = this.disconnectListeners.filter(l => l !== listener);
  }

  private notifyConnect() {
    this.connectListeners.forEach(listener => listener());
  }

  private notifyDisconnect() {
    this.disconnectListeners.forEach(listener => listener());
  }

  async connect(token: string): Promise<void> {
    if (this.isConnecting) {
      logger.debug('state', 'Connection already in progress');
      return;
    }

    if (this.client?.connected && this.authToken === token) {
      logger.debug('state', 'Already connected with same token');
      return;
    }

    this.authToken = token;
    this.isConnecting = true;

    logger.debug('state', 'Initializing WebSocket connection');
    this.setupClient();

    try {
      await this.ensureConnected();
      logger.debug('state', 'WebSocket connection established');
    } catch (error) {
      logger.error('state', 'Failed to connect to WebSocket', error);
      this.notifyDisconnect();
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (!this.client?.connected) return;

    logger.debug('state', 'Disconnecting WebSocket');
    this.client.deactivate();
    this.notifyDisconnect();
  }

  private async ensureConnected(): Promise<void> {
    if (this.client?.connected) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error('Max reconnection attempts reached');
    }

    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('WebSocket client not initialized'));
        return;
      }

      const originalOnConnect = this.client.onConnect;
      const originalOnStompError = this.client.onStompError;

      const cleanup = () => {
        this.client!.onConnect = originalOnConnect;
        this.client!.onStompError = originalOnStompError;
      };

      this.client.onConnect = () => {
        cleanup();
        resolve();
      };

      this.client.onStompError = (frame: IFrame) => {
        cleanup();
        reject(new Error(`STOMP error: ${frame.body}`));
      };
      
      try {
        this.client.activate();
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }

  addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers.delete(handler);
  }

  addReactionHandler(handler: ReactionHandler) {
    this.reactionHandlers.add(handler);
  }

  removeReactionHandler(handler: ReactionHandler) {
    this.reactionHandlers.delete(handler);
  }

  addPresenceHandler(handler: PresenceHandler) {
    this.presenceHandlers.add(handler);
  }

  removePresenceHandler(handler: PresenceHandler) {
    this.presenceHandlers.delete(handler);
  }

  addChannelEventHandler(handler: ChannelEventHandler) {
    this.channelEventHandlers.add(handler);
  }

  removeChannelEventHandler(handler: ChannelEventHandler) {
    this.channelEventHandlers.delete(handler);
  }

  async sendMessage(channelId: string, content: string): Promise<void> {
    if (!this.client?.connected) {
      logger.warn('state', 'Cannot send message - WebSocket not connected');
      return;
    }

    const destination = `/app/channels/${channelId}/messages`;
    const message = { content };

    logger.debug('state', `Sending message to ${destination}`, message);

    try {
      await this.client.publish({
        destination,
        body: JSON.stringify(message),
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });
    } catch (error) {
      logger.error('state', 'Failed to send message', error);
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const webSocketManager = WebSocketManager.getInstance(); 