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
        <div className="flex-1 overflow-y-auto p-4 font-mono">
            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full opacity-70">
                    $ echo "No messages yet. Start the conversation!"
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {messages.map(message => (
                        <div key={message.id} className="flex flex-col">
                            <div className="flex items-center gap-2 opacity-70">
                                <span className="font-semibold">{message.createdByUsername}@chat-genius</span>
                                <span className="text-sm">
                                    [{formatTimestamp(message.createdAt)}]
                                </span>
                                <span>$</span>
                            </div>
                            <p className="pl-4">{message.content}</p>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
} 