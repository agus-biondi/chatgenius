import { useState, useRef, useEffect } from 'react';
import { messageService } from '../../services/messageService';

interface MessageInputProps {
    channelId: string;
    onMessageSent: () => void;
}

export function MessageInput({ channelId, onMessageSent }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [channelId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await messageService.createMessage({ channelId, content: message.trim() });
            setMessage('');
            onMessageSent();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--terminal-green)]">
            <div className="command-prompt">
                <span className="text-[var(--terminal-dim-green)]">guest@chat-genius</span>
                <span className="text-[var(--terminal-dim-green)]">:~$</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-none outline-none placeholder-[var(--text-secondary)] ml-2 cursor"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="terminal-button"
                    disabled={isLoading || !message.trim()}
                >
                    {isLoading ? 'SENDING...' : 'SEND'}
                </button>
            </div>
        </form>
    );
} 