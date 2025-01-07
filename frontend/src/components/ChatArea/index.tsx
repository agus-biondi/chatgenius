import { useEffect, useState } from 'react';
import { Message } from '../../types';
import { messageService } from '../../services/messageService';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatAreaProps {
    channelId: string | null;
}

export function ChatArea({ channelId }: ChatAreaProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMessages = async () => {
        if (!channelId) return;
        
        setIsLoading(true);
        try {
            const response = await messageService.getChannelMessages(channelId);
            setMessages(response || []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setMessages([]);
        fetchMessages();
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
            <MessageInput channelId={channelId} onMessageSent={fetchMessages} />
        </div>
    );
} 