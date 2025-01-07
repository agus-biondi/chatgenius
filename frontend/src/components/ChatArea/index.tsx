import { useEffect, useState } from 'react';
import { Message } from '../../types';
import { messageService } from '../../services/messageService';
import { websocketService } from '../../services/websocketService';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatAreaProps {
    channelId: string | null;
}

export function ChatArea({ channelId }: ChatAreaProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleNewMessage = (message: Message) => {
        setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m.id === message.id)) {
                return prev;
            }
            return [...prev, message];
        });
    };

    const fetchMessages = async () => {
        if (!channelId) return;
        
        setIsLoading(true);
        try {
            const response = await messageService.getChannelMessages(channelId);
            // Sort messages by creation date, oldest first
            const sortedMessages = (response || []).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            // Remove any duplicates by ID
            const uniqueMessages = sortedMessages.filter((message, index, self) =>
                index === self.findIndex(m => m.id === message.id)
            );
            setMessages(uniqueMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setMessages([]);
        if (channelId) {
            fetchMessages();
            // Subscribe to WebSocket updates
            websocketService.subscribeToChannel(channelId, handleNewMessage);
        }
        
        // Cleanup subscription when changing channels
        return () => {
            if (channelId) {
                websocketService.unsubscribeFromChannel(channelId);
            }
        };
    }, [channelId]);

    if (!channelId) {
        return (
            <div className="flex-1 flex items-center justify-center opacity-70">
                $ select --channel to start chatting
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center opacity-70">
                $ loading messages...
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[var(--terminal-black)]">
            <MessageList messages={messages} />
            <MessageInput channelId={channelId} onMessageSent={() => {}} />
        </div>
    );
} 