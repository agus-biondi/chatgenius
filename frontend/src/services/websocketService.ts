import { Client, StompSubscription } from '@stomp/stompjs';
import { WebSocketEvent } from '../types/index';
import { ChannelWebSocketEvent } from '../types/channelEvents';

type EventCallback = (event: WebSocketEvent) => void;
type ChannelEventCallback = (event: ChannelWebSocketEvent) => void;
type SubscriptionMap = Map<string, StompSubscription>;

interface WebSocketSubscriber {
    channelId?: string;
    userId?: string;
    callback: EventCallback;
}

interface ChannelSubscriber {
    callback: ChannelEventCallback;
}

export class WebSocketService {
    private client: Client | null = null;
    private subscribers: Set<WebSocketSubscriber> = new Set();
    private channelSubscribers: Set<ChannelSubscriber> = new Set();
    private subscriptions: SubscriptionMap = new Map();

    initialize = () => {
        if (this.client) return;

        console.log('[WebSocket] Initializing client...');
        this.client = new Client({
            brokerURL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080/ws',
            onConnect: this.handleConnect,
            onDisconnect: () => {
                console.log('[WebSocket] Disconnected from WebSocket');
                this.cleanupSubscriptions();
            },
            onStompError: frame => {
                console.error('[WebSocket] Broker reported error: ' + frame.headers['message']);
                console.error('[WebSocket] Additional details: ' + frame.body);
            }
        });

        this.client.activate();
    };

    private handleConnect = () => {
        console.log('[WebSocket] Connected to WebSocket');
        console.log('[WebSocket] Current subscribers:', {
            channelSubscribers: this.channelSubscribers.size,
            subscribers: this.subscribers.size,
            subscriptions: Array.from(this.subscriptions.keys())
        });
        // Resubscribe to all topics after reconnection
        this.subscribers.forEach(subscriber => {
            this.setupSubscriptions(subscriber);
        });
    };

    private setupSubscriptions = (subscriber: WebSocketSubscriber) => {
        if (!this.client?.connected) {
            console.log('[WebSocket] Client not connected, skipping subscription setup');
            return;
        }

        // Subscribe to channel-specific events
        if (subscriber.channelId) {
            const channelTopic = `/topic/channel/${subscriber.channelId}`;
            if (!this.subscriptions.has(channelTopic)) {
                console.log('[WebSocket] Subscribing to channel topic:', channelTopic);
                const subscription = this.client.subscribe(channelTopic, message => {
                    const event = this.parseEvent(message.body);
                    if (event) this.notifySubscribers(event, subscriber.channelId);
                });
                this.subscriptions.set(channelTopic, subscription);
            }
        }

        // Subscribe to user-specific notifications
        if (subscriber.userId) {
            const userTopic = `/topic/user/${subscriber.userId}/notifications`;
            if (!this.subscriptions.has(userTopic)) {
                console.log('[WebSocket] Subscribing to user topic:', userTopic);
                const subscription = this.client.subscribe(userTopic, message => {
                    const event = this.parseEvent(message.body);
                    if (event) this.notifySubscribers(event, undefined, subscriber.userId);
                });
                this.subscriptions.set(userTopic, subscription);
            }
        }

        // Subscribe to channel events if there are channel subscribers
        if (this.channelSubscribers.size > 0 && !this.subscriptions.has('/topic/channels')) {
            console.log('[WebSocket] Subscribing to global channel events topic');
            const subscription = this.client.subscribe('/topic/channels', message => {
                console.log('[WebSocket] Received message on /topic/channels:', message.body);
                const event = this.parseChannelEvent(message.body);
                if (event) {
                    console.log('[WebSocket] Parsed channel event:', event);
                    this.notifyChannelSubscribers(event);
                } else {
                    console.error('[WebSocket] Failed to parse channel event from message:', message.body);
                }
            });
            this.subscriptions.set('/topic/channels', subscription);
            console.log('[WebSocket] Successfully subscribed to /topic/channels');
        }
    };

    private parseEvent = (messageBody: string): WebSocketEvent | null => {
        try {
            return JSON.parse(messageBody) as WebSocketEvent;
        } catch (error) {
            console.error('Failed to parse WebSocket event:', error);
            return null;
        }
    };

    private parseChannelEvent = (messageBody: string): ChannelWebSocketEvent | null => {
        try {
            return JSON.parse(messageBody) as ChannelWebSocketEvent;
        } catch (error) {
            console.error('Failed to parse Channel WebSocket event:', error);
            return null;
        }
    };

    private notifySubscribers = (
        event: WebSocketEvent, 
        channelId?: string, 
        userId?: string
    ) => {
        this.subscribers.forEach(subscriber => {
            if (
                (channelId && subscriber.channelId === channelId) ||
                (userId && subscriber.userId === userId)
            ) {
                subscriber.callback(event);
            }
        });
    };

    private notifyChannelSubscribers = (event: ChannelWebSocketEvent) => {
        this.channelSubscribers.forEach(subscriber => {
            subscriber.callback(event);
        });
    };

    private cleanupSubscriptions = () => {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
    };

    subscribeToChannel = (channelId: string, callback: EventCallback) => {
        const subscriber = { channelId, callback };
        this.subscribers.add(subscriber);
        this.setupSubscriptions(subscriber);

        return () => {
            this.subscribers.delete(subscriber);
            this.cleanupUnusedSubscriptions();
        };
    };

    subscribeToUserNotifications = (userId: string, callback: EventCallback) => {
        const subscriber = { userId, callback };
        this.subscribers.add(subscriber);
        this.setupSubscriptions(subscriber);

        return () => {
            this.subscribers.delete(subscriber);
            this.cleanupUnusedSubscriptions();
        };
    };

    private cleanupUnusedSubscriptions = () => {
        // Get all active channel and user IDs
        const activeChannelIds = new Set([...this.subscribers].map(s => s.channelId).filter(Boolean));
        const activeUserIds = new Set([...this.subscribers].map(s => s.userId).filter(Boolean));

        // Cleanup unused subscriptions
        this.subscriptions.forEach((subscription, topic) => {
            const isChannelTopic = topic.startsWith('/topic/channel/');
            const isUserTopic = topic.startsWith('/topic/user/');

            if (isChannelTopic) {
                const channelId = topic.split('/').pop();
                if (channelId && !activeChannelIds.has(channelId)) {
                    subscription.unsubscribe();
                    this.subscriptions.delete(topic);
                }
            } else if (isUserTopic) {
                const userId = topic.split('/')[3]; // /topic/user/{userId}/notifications
                if (userId && !activeUserIds.has(userId)) {
                    subscription.unsubscribe();
                    this.subscriptions.delete(topic);
                }
            }
        });
    };

    subscribeToChannelEvents = (callback: ChannelEventCallback) => {
        console.log('[WebSocket] Setting up channel events subscription');
        const subscriber = { callback };
        this.channelSubscribers.add(subscriber);
        
        // Setup subscription if we're connected
        if (this.client?.connected && !this.subscriptions.has('/topic/channels')) {
            console.log('[WebSocket] Client connected, subscribing to /topic/channels');
            const subscription = this.client.subscribe('/topic/channels', message => {
                console.log('[WebSocket] Received message on /topic/channels:', message.body);
                const event = this.parseChannelEvent(message.body);
                if (event) {
                    console.log('[WebSocket] Parsed channel event:', event);
                    this.notifyChannelSubscribers(event);
                } else {
                    console.error('[WebSocket] Failed to parse channel event from message:', message.body);
                }
            });
            this.subscriptions.set('/topic/channels', subscription);
            console.log('[WebSocket] Successfully subscribed to /topic/channels');
        } else {
            console.log('[WebSocket] Client not ready for /topic/channels subscription:', {
                connected: this.client?.connected,
                hasSubscription: this.subscriptions.has('/topic/channels')
            });
        }

        // Return cleanup function
        return () => {
            console.log('[WebSocket] Cleaning up channel events subscription');
            this.channelSubscribers.delete(subscriber);
            if (this.channelSubscribers.size === 0) {
                const subscription = this.subscriptions.get('/topic/channels');
                if (subscription) {
                    subscription.unsubscribe();
                    this.subscriptions.delete('/topic/channels');
                    console.log('[WebSocket] Unsubscribed from /topic/channels');
                }
            }
        };
    };

    disconnect = () => {
        if (this.client) {
            this.cleanupSubscriptions();
            this.client.deactivate();
            this.client = null;
        }
    };
}

// Export a singleton instance
export const websocketService = new WebSocketService(); 