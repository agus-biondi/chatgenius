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

    // Focus input when component mounts or channel changes
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
            // Ensure focus is maintained after state updates
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--terminal-green)]">
            <div className="flex gap-2 items-center font-mono">
                <span className="opacity-70">$</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="echo 'your message'"
                    className="flex-1 p-2 bg-transparent border-none outline-none placeholder-[var(--terminal-dim-green)]"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="px-4 py-1 border border-[var(--terminal-green)] hover:bg-[var(--terminal-gray)] transition-colors disabled:opacity-50"
                    disabled={isLoading || !message.trim()}
                >
                    {isLoading ? 'sending...' : '[ENTER]'}
                </button>
            </div>
        </form>
    );
} 