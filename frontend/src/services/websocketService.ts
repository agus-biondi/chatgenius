import { Client } from '@stomp/stompjs';
import { Message } from '../types';

class WebSocketService {
    private client: Client;
    private messageHandlers: Map<string, (message: Message) => void> = new Map();
    private isConnected: boolean = false;
    private pendingSubscriptions: Map<string, (message: Message) => void> = new Map();

    constructor() {
        this.client = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            debug: (str) => {
                console.debug('STOMP:', str);
            },
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

    private processPendingSubscriptions() {
        this.pendingSubscriptions.forEach((handler, channelId) => {
            this.subscribeToChannel(channelId, handler);
        });
        this.pendingSubscriptions.clear();
    }

    subscribeToChannel(channelId: string, onMessage: (message: Message) => void) {
        if (!this.isConnected) {
            console.log('WebSocket not connected, queueing subscription for channel:', channelId);
            this.pendingSubscriptions.set(channelId, onMessage);
            return;
        }

        if (this.messageHandlers.has(channelId)) {
            this.unsubscribeFromChannel(channelId);
        }

        this.messageHandlers.set(channelId, onMessage);
        
        return this.client.subscribe(`/topic/channel/${channelId}`, (message) => {
            console.debug('Received WebSocket message:', message.body);
            const messageData = JSON.parse(message.body) as Message;
            console.debug('Parsed message data:', messageData);
            onMessage(messageData);
        });
    }

    unsubscribeFromChannel(channelId: string) {
        this.messageHandlers.delete(channelId);
        this.pendingSubscriptions.delete(channelId);
    }
}

export const websocketService = new WebSocketService(); 