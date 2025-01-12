import React, { useState, useCallback, KeyboardEvent, useRef, useEffect } from 'react';
import { logger } from '../../utils/logger';

interface MessageInputProps {
    channelId: string;
    channelName: string;
    onSendMessage: (content: string) => Promise<void>;
}

export function MessageInput({ channelId, channelName, onSendMessage }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLFormElement>(null);

    // Auto-resize textarea with max height
    useEffect(() => {
        if (textareaRef.current) {
            // Reset height to auto to get proper scrollHeight
            textareaRef.current.style.height = 'auto';
            
            // Get the content height
            const contentHeight = textareaRef.current.scrollHeight;
            
            // Set height to either content height or minimum height
            textareaRef.current.style.height = `${Math.max(contentHeight, 38)}px`;
            
            // Overflow is handled by CSS max-height and overflow-y
        }
    }, [message]);

    // Focus textarea when channel changes or component mounts
    useEffect(() => {
        textareaRef.current?.focus();
    }, [channelId]);

    const handleSubmit = useCallback(async () => {
        if (!message.trim() || isLoading) return;

        setIsLoading(true);
        try {
            await onSendMessage(message.trim());
            setMessage('');
            textareaRef.current?.focus();
            logger.debug('state', 'Message sent', { channelId });
        } catch (error) {
            logger.error('state', 'Failed to send message', { channelId, error });
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    }, [channelId, message, onSendMessage, isLoading]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <form ref={containerRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-4 border-t border-[#6edb71]">
            <div className="flex flex-col gap-2">
                <div className="flex">
                    <div className="w-[2rem] flex justify-end text-[var(--terminal-green)]">$</div>
                    <div className="w-[3.5rem] pl-2 text-[#9ba8b9]">echo</div>
                    <div className="flex-1">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="# type your message"
                            className="terminal-input resize-none min-h-[38px] max-h-[30vh] overflow-y-auto w-full"
                            disabled={isLoading}
                            rows={1}
                        />
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="w-[2rem] flex justify-end text-[var(--terminal-green)]">$</div>
                    <div className="flex-1 flex items-center justify-between pl-2">
                        <span className="text-[#9ba8b9]">./channels/{channelName}/messages.log</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[#9ba8b9] text-sm opacity-50"># press enter to send</span>
                            <button
                                type="submit"
                                disabled={!message.trim() || isLoading}
                                className="flex items-center justify-center h-[38px] px-3 hover:text-[#6edb71] transition-colors disabled:opacity-50 disabled:hover:text-[#9ba8b9] text-3xl translate-y-[2px]"
                                title="Press Enter to send message"
                            >
                                {isLoading ? '[wait]' : '↵'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
} 