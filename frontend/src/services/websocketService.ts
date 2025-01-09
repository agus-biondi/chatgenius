import { Client } from '@stomp/stompjs';
import { Message, Reaction } from '../types';

// Convert HTTP URL to WebSocket URL
const getWebSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const baseUrl = apiUrl.replace('/api', '').replace('http://', '').replace('https://', '');
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    return `${protocol}${baseUrl}/ws`;
};

class WebSocketService {
    private client: Client | null = null;
    private messageHandlers: Map<string, (message: Message | Reaction) => void> = new Map();
    private subscriptions: Map<string, any[]> = new Map();
    private isConnected: boolean = false;
    private pendingSubscriptions: Map<string, (message: Message | Reaction) => void> = new Map();

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

    subscribeToChannel(channelId: string, onMessage: (message: Message | Reaction) => void) {
        if (!this.client || !this.isConnected) {
            console.log('WebSocket not connected, queueing subscription for channel:', channelId);
            this.pendingSubscriptions.set(channelId, onMessage);
            return;
        }

        console.log('Subscribing to channel:', channelId);

        // Clean up existing subscriptions for this channel
        this.unsubscribeFromChannel(channelId);

        this.messageHandlers.set(channelId, onMessage);
        
        // Subscribe to both messages and reactions for the channel
        const messageSubscription = this.client.subscribe(`/topic/channel/${channelId}`, (message) => {
            console.log('Received WebSocket message for channel:', channelId);
            console.debug('Message body:', message.body);
            const messageData = JSON.parse(message.body) as Message;
            onMessage(messageData);
        });

        const reactionSubscription = this.client.subscribe(`/topic/channel/${channelId}/reactions`, (message) => {
            console.log('Received WebSocket reaction for channel:', channelId);
            console.debug('Raw reaction body:', message.body);
            try {
                const reactionData = JSON.parse(message.body) as Reaction;
                console.debug('Parsed reaction data:', reactionData);
                console.debug('Reaction fields:', Object.keys(reactionData));
                console.debug('Reaction messageId:', reactionData.messageId);
                onMessage(reactionData);
            } catch (error) {
                console.error('Error parsing reaction data:', error);
                console.error('Raw message body:', message.body);
            }
        });

        console.log('Successfully subscribed to channel topics:', channelId);

        // Store the subscriptions for cleanup
        this.subscriptions.set(channelId, [messageSubscription, reactionSubscription]);
    }

    unsubscribeFromChannel(channelId: string) {
        // Unsubscribe from existing subscriptions
        const existingSubscriptions = this.subscriptions.get(channelId);
        if (existingSubscriptions) {
            console.log('Unsubscribing from channel:', channelId);
            existingSubscriptions.forEach(subscription => {
                console.log('Unsubscribing from subscription:', subscription.id);
                subscription.unsubscribe();
            });
            this.subscriptions.delete(channelId);
            console.log('Successfully unsubscribed from channel:', channelId);
        }
        
        this.messageHandlers.delete(channelId);
        this.pendingSubscriptions.delete(channelId);
    }

}

export const websocketService = new WebSocketService(); 