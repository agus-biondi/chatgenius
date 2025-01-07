import { useState, useRef, useEffect } from 'react';
import { messageService } from '../../services/messageService';

interface MessageInputProps {
    channelId: string;
}

export function MessageInput({ channelId }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [message]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await messageService.createMessage({
                channelId,
                content: message.trim()
            });
            setMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="border-t border-[var(--terminal-green)]">
            <form onSubmit={handleSubmit} className="p-4">
                <div className="flex items-start gap-2">
                    <span className="text-[var(--terminal-dim-green)] mt-1.5">$</span>
                    <div className="flex-1">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message... (Shift+Enter for new line)"
                            className="w-full bg-transparent border-none outline-none resize-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] min-h-[24px]"
                            disabled={isLoading}
                            rows={1}
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-[var(--terminal-green)] hover:bg-[var(--terminal-gray)] transition-colors disabled:opacity-50"
                        disabled={isLoading || !message.trim()}
                    >
                        [ENTER]
                    </button>
                </div>
            </form>
        </div>
    );
} 