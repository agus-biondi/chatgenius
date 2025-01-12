import { Client, Message, StompSubscription } from '@stomp/stompjs';
import { logger } from '../../utils/logger';
import { MessageDTO, NotificationDTO, Channel, CreateMessageRequest } from '../../types';
import SockJS from 'sockjs-client';

type PresenceStatus = 'online' | 'offline' | 'away';

interface ChannelEvent {
  type: 'CREATED' | 'DELETED';
  channel: Channel;
}

export class WebSocketManager {
  private client: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageHandlers: Map<string, ((message: MessageDTO) => void)[]> = new Map();
  private typingHandlers: Map<string, ((username: string) => void)[]> = new Map();
  private notificationHandlers: ((notification: NotificationDTO) => void)[] = [];
  private channelEventHandlers: ((event: ChannelEvent) => void)[] = [];
  private connectionPromise: Promise<void> | null = null;
  private static instance: WebSocketManager;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private authToken: string | null = null;
  private isReady: boolean = false;

  private constructor() {
    logger.info('state', 'Initializing WebSocket Manager');
    
    this.client = new Client({
      webSocketFactory: () => {
        const socket = new SockJS(`${import.meta.env.VITE_WS_URL || 'http://localhost:8080'}/ws`);
        return socket;
      },
      connectHeaders: this.authToken ? {
        Authorization: `Bearer ${this.authToken}`
      } : {},
      debug: (str) => {
        logger.debug('state', 'STOMP Debug', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    logger.debug('state', 'WebSocket client configured', { 
      url: this.client.brokerURL,
      reconnectDelay: 5000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Connection success handler
    this.client.onConnect = () => {
      logger.info('state', 'WebSocket connection established', { 
        url: this.client.brokerURL,
        sessionId: this.client.connected ? 'connected' : 'disconnected'
      });
      this.reconnectAttempts = 0;
      this.isReady = true;
      this.sendPresenceStatus('online');
    };

    // STOMP protocol error handler
    this.client.onStompError = (frame) => {
      const error = new Error(`STOMP error: ${frame.body}`);
      logger.error('state', 'STOMP protocol error', { 
        error: error.message,
        command: frame.command,
        headers: frame.headers,
        body: frame.body 
      });
      this.handleConnectionError(error);
    };

    // WebSocket error handler
    this.client.onWebSocketError = (event) => {
      const error = event instanceof Error ? event : new Error('Unknown WebSocket error');
      logger.error('state', 'WebSocket connection error', { 
        type: event.type,
        message: error.message
      });
      this.handleConnectionError(error);
    };

    // Connection close handler
    this.client.onWebSocketClose = () => {
      logger.warn('state', 'WebSocket connection closed');
      this.isReady = false;
      this.sendPresenceStatus('offline');
      this.connectionPromise = null;
      
      // Attempt reconnection if not explicitly disconnected
      if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempts++;
        logger.info('state', `Attempting reconnection (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
        this.client.activate();
      } else {
        logger.error('state', 'Max reconnection attempts reached');
      }
    };
  }

  private handleConnectionError(error: Error): void {
    logger.error('state', 'Connection error occurred', { error });
    if (this.connectionPromise) {
      this.connectionPromise = null;
    }
  }

  private async sendPresenceStatus(status: PresenceStatus): Promise<void> {
    if (!this.client.connected) return;

    try {
      this.client.publish({
        destination: '/app/presence',
        body: JSON.stringify({ status }),
      });
      logger.debug('state', `Presence status sent`, { status });
    } catch (error) {
      logger.error('state', 'Failed to send presence status', { status, error });
    }
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  async connect(token: string): Promise<void> {
    if (this.client.connected) {
      logger.debug('state', 'WebSocket already connected');
      return;
    }

    if (this.connectionPromise) {
      logger.debug('state', 'WebSocket connection already in progress');
      return this.connectionPromise;
    }

    this.authToken = token;
    this.isReady = false;

    logger.info('state', 'Initiating WebSocket connection', {
      url: this.client.brokerURL
    });

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.client.connectHeaders = {
          Authorization: `Bearer ${token}`,
        };

        this.client.onConnect = () => {
          logger.info('state', 'WebSocket connection established', { 
            url: this.client.brokerURL,
            sessionId: this.client.connected ? 'connected' : 'disconnected'
          });
          this.isReady = true;
          resolve();
        };

        this.client.onStompError = (frame) => {
          const error = new Error(`STOMP error: ${frame.body}`);
          logger.error('state', 'STOMP protocol error during connection', { 
            error: error.message,
            frame 
          });
          reject(error);
          this.connectionPromise = null;
        };

        logger.debug('state', 'Activating WebSocket client');
        this.client.activate();
      } catch (error) {
        logger.error('state', 'Failed to initiate WebSocket connection', { error });
        reject(error);
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    this.isReady = false;
    this.sendPresenceStatus('offline').catch(error => 
      logger.error('state', 'Failed to send offline status before disconnect', { error })
    );
    this.client.deactivate();
    this.subscriptions.clear();
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.notificationHandlers = [];
    this.channelEventHandlers = [];
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    logger.info('state', 'WebSocket connection closed');
  }

  async subscribeToChannel(
    channelId: string,
    onMessage: (message: MessageDTO) => void,
    onTyping?: (username: string) => void
  ): Promise<void> {
    // Validate channelId
    if (!channelId || channelId.trim() === '') {
      logger.warn('state', 'Attempted to subscribe with invalid channelId', { channelId });
      throw new Error('Invalid channelId: Channel ID is required');
    }

    await this.ensureConnected();

    // Subscribe to messages
    if (!this.subscriptions.has(channelId)) {
      const subscription = this.client.subscribe(
        `/topic/channels/${channelId}`,
        (message: Message) => {
          const messageData = JSON.parse(message.body) as MessageDTO;
          logger.debug('state', 'Received message on channel', { channelId, messageData });
          this.messageHandlers.get(channelId)?.forEach(handler => handler(messageData));
        }
      );
      this.subscriptions.set(channelId, subscription);
      logger.info('state', 'Subscribed to channel messages', { channelId });
    }

    // Add message handler
    if (!this.messageHandlers.has(channelId)) {
      this.messageHandlers.set(channelId, []);
    }
    this.messageHandlers.get(channelId)?.push(onMessage);

    // Subscribe to typing events if handler provided
    if (onTyping) {
      if (!this.typingHandlers.has(channelId)) {
        this.client.subscribe(
          `/topic/channels/${channelId}/typing`,
          (message: Message) => {
            const username = message.body;
            logger.debug('state', 'Received typing event', { channelId, username });
            this.typingHandlers.get(channelId)?.forEach(handler => handler(username));
          }
        );
        this.typingHandlers.set(channelId, []);
        logger.info('state', 'Subscribed to channel typing events', { channelId });
      }
      this.typingHandlers.get(channelId)?.push(onTyping);
    }
  }

  async unsubscribeFromChannel(channelId: string): Promise<void> {
    const subscription = this.subscriptions.get(channelId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(channelId);
      this.messageHandlers.delete(channelId);
      this.typingHandlers.delete(channelId);
      logger.info('state', 'Unsubscribed from channel', { channelId });
    }
  }

  async sendMessage(channelId: string, content: string, parentId?: string): Promise<void> {
    // Validate channelId
    if (!channelId || channelId.trim() === '') {
      logger.warn('state', 'Attempted to send message with invalid channelId', { channelId });
      throw new Error('Invalid channelId: Channel ID is required');
    }

    await this.ensureConnected();

    const messageRequest: CreateMessageRequest = {
      content,
      parentId
    };

    this.client.publish({
      destination: `/app/channels/${channelId}/messages`,
      body: JSON.stringify(messageRequest),
    });
    logger.debug('state', 'Sent message to channel', { channelId, content, parentId });
  }

  async sendTypingEvent(channelId: string): Promise<void> {
    // Validate channelId
    if (!channelId || channelId.trim() === '') {
      logger.warn('state', 'Attempted to send typing event with invalid channelId', { channelId });
      throw new Error('Invalid channelId: Channel ID is required');
    }

    await this.ensureConnected();

    this.client.publish({
      destination: `/app/channels/${channelId}/typing`,
      body: '',
    });
    logger.debug('state', 'Sent typing event to channel', { channelId });
  }

  async subscribeToNotifications(onNotification: (notification: NotificationDTO) => void): Promise<void> {
    await this.ensureConnected();
    
    // Add notification handler
    this.notificationHandlers.push(onNotification);
    
    // Subscribe to notifications if not already subscribed
    if (!this.subscriptions.has('notifications')) {
      const subscription = this.client.subscribe(
        '/topic/notifications',
        (message: Message) => {
          try {
            const notification = JSON.parse(message.body) as NotificationDTO;
            logger.debug('state', 'Received notification', { notification });
            this.notificationHandlers.forEach(handler => handler(notification));
          } catch (error) {
            logger.error('state', 'Failed to parse notification', { error, body: message.body });
          }
        }
      );
      this.subscriptions.set('notifications', subscription);
      logger.info('state', 'Subscribed to notifications');
    }
  }

  async unsubscribeFromNotifications(handler: (notification: NotificationDTO) => void): Promise<void> {
    // Remove specific handler
    this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
    
    // If no handlers left, unsubscribe from notifications
    if (this.notificationHandlers.length === 0 && this.subscriptions.has('notifications')) {
      const subscription = this.subscriptions.get('notifications');
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete('notifications');
        logger.info('state', 'Unsubscribed from notifications');
      }
    }
  }

  async subscribeToChannelEvents(onEvent: (event: ChannelEvent) => void): Promise<void> {
    await this.ensureConnected();
    
    // Add event handler
    this.channelEventHandlers.push(onEvent);
    
    // Subscribe to channel events if not already subscribed
    if (!this.subscriptions.has('channel-events')) {
      const subscription = this.client.subscribe(
        '/topic/channels/events',
        (message: Message) => {
          try {
            const event = JSON.parse(message.body) as ChannelEvent;
            logger.debug('state', 'Received channel event', { type: event.type });
            this.channelEventHandlers.forEach(handler => handler(event));
          } catch (error) {
            logger.error('state', 'Failed to parse channel event', { error, body: message.body });
          }
        }
      );
      this.subscriptions.set('channel-events', subscription);
      logger.info('state', 'Subscribed to channel events');
    }
  }

  async unsubscribeFromChannelEvents(handler: (event: ChannelEvent) => void): Promise<void> {
    // Remove specific handler
    this.channelEventHandlers = this.channelEventHandlers.filter(h => h !== handler);
    
    // If no handlers left, unsubscribe from channel events
    if (this.channelEventHandlers.length === 0 && this.subscriptions.has('channel-events')) {
      const subscription = this.subscriptions.get('channel-events');
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete('channel-events');
        logger.info('state', 'Unsubscribed from channel events');
      }
    }
  }

  public isConnected(): boolean {
    return this.isReady && this.client.connected;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      if (!this.connectionPromise) {
        logger.error('state', 'WebSocket not initialized');
        throw new Error('WebSocket not initialized. Call connect() first.');
      }
      await this.connectionPromise;
      // Double check after waiting
      if (!this.isConnected()) {
        throw new Error('WebSocket connection failed');
      }
    }
  }
}

// Export the singleton instance
export const webSocketManager = WebSocketManager.getInstance(); 