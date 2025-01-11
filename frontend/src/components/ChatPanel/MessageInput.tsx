import React, { useState, useCallback, KeyboardEvent } from 'react';
import { logger } from '../../utils/logger';

interface MessageInputProps {
    channelId: string;
    channelName: string;
    onSendMessage: (content: string) => Promise<void>;
}

export function MessageInput({ channelId, channelName, onSendMessage }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!message.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await onSendMessage(message.trim());
            setMessage('');
            logger.debug('state', 'Message sent', { channelId });
        } catch (error) {
            logger.error('state', 'Failed to send message', { channelId, error });
        } finally {
            setIsLoading(false);
        }
    }, [channelId, message, onSendMessage, isLoading]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="p-4 border-t border-[#6edb71]">
            <div className="flex items-start gap-2">
                <div className="flex items-center gap-2 text-[#9ba8b9]">
                    <span>$</span>
                    <span>echo</span>
                </div>
                <div className="flex-1">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Type your message in #${channelName}...`}
                        className="w-full p-2 bg-[var(--terminal-gray)] text-[#b8cceb] placeholder-[#9ba8b9] resize-none outline-none border border-transparent focus:border-[#6edb71] transition-colors"
                        rows={1}
                        disabled={isLoading}
                    />
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || isLoading}
                    className="text-[#9ba8b9] hover:text-[#6edb71] transition-colors disabled:opacity-50"
                >
                    {isLoading ? '[wait]' : '[enter]'}
                </button>
            </div>
        </div>
    );
} 