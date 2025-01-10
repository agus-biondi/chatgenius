import { useState, useRef, useEffect } from 'react';
import { messageService } from '../../services/messageService';

interface MessageInputProps {
    channelId: string;
    channelName: string;
}

export function MessageInput({ channelId, channelName }: MessageInputProps) {
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
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 0);
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

    // Focus the textarea when the component mounts or channel changes
    useEffect(() => {
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    }, [channelId]);

    return (
        <div className="border-t border-[#6edb71] relative z-10">
            <form onSubmit={handleSubmit} className="p-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[#6edb71]">$</span>
                        <span className="text-[#b8cceb]">echo</span>
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="# Write message to append to channel"
                            className="flex-1 p-2 bg-[var(--terminal-gray)] text-[#b8cceb] placeholder-[#9ba8b9] outline-none border border-transparent focus:border-[#6edb71] transition-colors resize-none min-h-[24px] leading-6 relative z-10"
                            disabled={isLoading}
                            rows={1}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[#6edb71]">$</span>
                        <span className="text-[#b8cceb]">{'>> ./channels/'}<span className="text-[#6edb71]">{channelName}</span>{'/messages.log'}</span>
                        <div className="flex-1"></div>
                        <button
                            type="submit"
                            className="text-[#9ba8b9] hover:text-[#6edb71] transition-colors disabled:opacity-50"
                            disabled={isLoading || !message.trim()}
                        >
                            {isLoading ? '[wait]' : '[enter]'}
                        </button>
                    </div>
                </div>
                {/* Future options will go here */}
                {/* <div className="flex items-center gap-2 mt-2 pl-8">
                    <button type="button" className="text-[#9ba8b9] hover:text-[#6edb71]">
                        [--attach-file]
                    </button>
                </div> */}
            </form>
        </div>
    );
} 