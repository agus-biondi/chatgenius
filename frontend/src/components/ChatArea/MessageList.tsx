import { Message } from '../../types';
import { useEffect, useRef } from 'react';

interface MessageListProps {
    messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-[var(--text-secondary)] cursor">
                        No messages yet. Start the conversation...
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {messages.map(message => (
                        <div key={message.id} className="message group">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                                <span className="font-medium text-[var(--text-primary)]">
                                    {message.createdByUsername}@chat-genius
                                </span>
                                <span className="opacity-70">
                                    [{formatTimestamp(message.createdAt)}]
                                </span>
                            </div>
                            <div className="mt-1 text-[var(--text-primary)]">
                                {message.content}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
} 