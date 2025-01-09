import { Client } from '@stomp/stompjs';
import { WebSocketEvent } from '../types';

// Convert HTTP URL to WebSocket URL
const getWebSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const baseUrl = apiUrl.replace('/api', '').replace('http://', '').replace('https://', '');
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    return `${protocol}${baseUrl}/ws`;
};

class WebSocketService {
    private client: Client | null = null;
    private messageHandlers: Map<string, (event: WebSocketEvent) => void> = new Map();
    private subscriptions: Map<string, any> = new Map();
    private isConnected: boolean = false;
    private pendingSubscriptions: Map<string, (event: WebSocketEvent) => void> = new Map();

    initialize() {
        if (this.client) {
            return;
        }

        this.client = new Client({
            brokerURL: getWebSocketUrl(),
            debug: import.meta.env.DEV ? (str) => console.debug('STOMP:', str) : undefined,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = () => {
            console.log('Connected to WebSocket');
            this.isConnected = true;
            this.processPendingSubscriptions();
        };

        this.client.onStompError = (frame) => {
            console.error('STOMP error:', frame);
            this.isConnected = false;
        };

        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.isConnected = false;
            this.messageHandlers.clear();
            this.subscriptions.clear();
            this.pendingSubscriptions.clear();
        }
    }

    private processPendingSubscriptions() {
        this.pendingSubscriptions.forEach((handler, channelId) => {
            this.subscribeToChannel(channelId, handler);
        });
        this.pendingSubscriptions.clear();
    }

    subscribeToChannel(channelId: string, onEvent: (event: WebSocketEvent) => void) {
        if (!this.client || !this.isConnected) {
            console.log('WebSocket not connected, queueing subscription for channel:', channelId);
            this.pendingSubscriptions.set(channelId, onEvent);
            return;
        }

        console.log('Subscribing to channel:', channelId);

        // Clean up existing subscriptions for this channel
        this.unsubscribeFromChannel(channelId);

        this.messageHandlers.set(channelId, onEvent);
        
        // Subscribe to channel events
        const subscription = this.client.subscribe(`/topic/channel/${channelId}`, (message) => {
            console.log('Received WebSocket event for channel:', channelId);
            console.debug('Event body:', message.body);
            try {
                const event = JSON.parse(message.body) as WebSocketEvent;
                onEvent(event);
            } catch (error) {
                console.error('Error parsing WebSocket event:', error);
                console.error('Raw message body:', message.body);
            }
        });

        console.log('Successfully subscribed to channel:', channelId);

        // Store the subscription for cleanup
        this.subscriptions.set(channelId, subscription);
    }

    unsubscribeFromChannel(channelId: string) {
        // Unsubscribe from existing subscriptions
        const existingSubscriptions = this.subscriptions.get(channelId);
        if (existingSubscriptions) {
            console.log('Unsubscribing from channel:', channelId);
            existingSubscriptions.unsubscribe();
            this.subscriptions.delete(channelId);
            console.log('Successfully unsubscribed from channel:', channelId);
        }
        
        this.messageHandlers.delete(channelId);
        this.pendingSubscriptions.delete(channelId);
    }

}

export const websocketService = new WebSocketService(); 