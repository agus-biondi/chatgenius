import { Message, Reaction, Channel } from '../../types/index';
import { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react';
import { reactionService } from '../../services/reactionService';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useUser } from '@clerk/clerk-react';

interface MessageItemProps {
    message: Message;
    channel: Channel | null;
    onReaction: (messageId: string, emoji: string) => Promise<void>;
    showEmojiPicker: string | null;
    onToggleEmojiPicker: (messageId: string | null) => void;
}

const MessageItem = memo(({ message, channel, onReaction, showEmojiPicker, onToggleEmojiPicker }: MessageItemProps) => {
    const { user } = useUser();

    const formatTimestamp = useCallback((timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }, []);

    // Group reactions by emoji - memoize this computation
    const groupedReactions = useMemo(() => {
        return message.reactions.reduce((groups: Record<string, Reaction[]>, reaction) => {
            const key = reaction.emoji;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(reaction);
            return groups;
        }, {});
    }, [message.reactions]);

    // Memoize reaction handlers
    const handleReactionClick = useCallback((messageId: string, emoji: string) => {
        onReaction(messageId, emoji);
    }, [onReaction]);

    const handleEmojiPickerToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleEmojiPicker(showEmojiPicker === message.id ? null : message.id);
    }, [message.id, showEmojiPicker, onToggleEmojiPicker]);

    return (
        <div className="message group hover:bg-[#1e2532] rounded transition-colors p-1.5 -mx-2">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
                <span className="font-medium flex items-center">
                    <span className="text-[#6edb71] font-bold">{message.createdByUsername}</span>
                    <span className="text-[#db6e7a]">@electrochat-9000</span>
                    <span className="text-[#6e8adb]">#{channel?.name || 'unknown'}</span>
                </span>
                <span className="text-[#9ba8b9]">
                    [{formatTimestamp(message.createdAt)}]
                </span>
            </div>
            <div className="flex gap-2">
                <div className="text-[var(--text-primary)] opacity-80 pl-4 flex-1 flex flex-col">
                    {message.content.split('\n').map((line: string, i: number) => (
                        <div key={i} className="text-[#b8cceb] text-base">{line || '\u00A0'}</div>
                    ))}
                    {Object.entries(groupedReactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                            {Object.entries(groupedReactions).map(([emoji, reactions]: [string, Reaction[]]) => {
                                const hasUserReacted = reactions.some((reaction: Reaction) => reaction.userId === user?.id);
                                return (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReactionClick(message.id, emoji)}
                                        className={`px-1.5 text-sm rounded border border-[#6edb71] hover:bg-[var(--terminal-gray)] ${
                                            hasUserReacted ? 'bg-[var(--terminal-gray)]' : 'bg-transparent'
                                        }`}
                                    >
                                        {emoji}{reactions.length > 1 ? ` ${reactions.length}` : ''}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center items-end gap-2 min-w-[100px]">
                    <div className="flex items-center gap-1">
                        {['🐧', '✅', '👀'].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleReactionClick(message.id, emoji)}
                                className="text-[#9ba8b9] hover:text-[#6edb71] opacity-0 group-hover:opacity-100"
                            >
                                [{emoji}]
                            </button>
                        ))}
                        <button
                            onClick={handleEmojiPickerToggle}
                            className="text-[#9ba8b9] hover:text-[#6edb71] opacity-0 group-hover:opacity-100 emoji-picker-toggle"
                        >
                            [more]
                        </button>
                    </div>
                </div>
            </div>
            {showEmojiPicker === message.id && (
                <div 
                    className="absolute z-10"
                    style={{ right: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Picker
                        data={data}
                        onEmojiSelect={(emoji: any) => {
                            handleReactionClick(message.id, emoji.native);
                        }}
                        theme="dark"
                        previewPosition="none"
                        skinTonePosition="none"
                        searchPosition="none"
                        navPosition="none"
                        perLine={8}
                        maxFrequentRows={1}
                    />
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Deep compare message properties that matter
    const messageEqual = 
        prevProps.message.id === nextProps.message.id &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.createdByUsername === nextProps.message.createdByUsername &&
        prevProps.message.createdAt === nextProps.message.createdAt &&
        prevProps.message.reactions.length === nextProps.message.reactions.length;

    const channelEqual = prevProps.channel?.name === nextProps.channel?.name;
    const emojiPickerEqual = prevProps.showEmojiPicker === nextProps.showEmojiPicker;

    return messageEqual && channelEqual && emojiPickerEqual;
});

interface MessageListProps {
    messages: Message[];
    channel: Channel | null;
}

export const MessageList = memo(({ messages, channel }: MessageListProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!user) return;
        
        try {
            const existingReaction = messages
                .find(m => m.id === messageId)?.reactions
                .find(r => r.userId === user.id && r.emoji === emoji);

            if (existingReaction) {
                await reactionService.removeReaction(messageId, existingReaction.id);
            } else {
                await reactionService.addReaction(messageId, emoji);
            }
            setShowEmojiPicker(null);
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
        }
    }, [messages, user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.emoji-mart') && !target.closest('.emoji-picker-toggle')) {
                setShowEmojiPicker(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Memoize the message list rendering
    const messageListContent = useMemo(() => {
        if (messages.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center h-full gap-2">
                    <div className="text-[#9ba8b9]">$ cat ./messages</div>
                    <div className="text-[#9ba8b9]">cat: ./messages: No such file or directory</div>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-1">
                {messages.map(message => (
                    <MessageItem
                        key={message.id}
                        message={message}
                        channel={channel}
                        onReaction={handleReaction}
                        showEmojiPicker={showEmojiPicker}
                        onToggleEmojiPicker={setShowEmojiPicker}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        );
    }, [messages, channel, handleReaction, showEmojiPicker]);

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
            {messageListContent}
        </div>
    );
}, (prevProps, nextProps) => {
    // Deep compare messages array
    const messagesEqual = 
        prevProps.messages.length === nextProps.messages.length &&
        prevProps.messages.every((msg, i) => {
            const nextMsg = nextProps.messages[i];
            return msg.id === nextMsg.id && 
                   msg.content === nextMsg.content &&
                   msg.reactions.length === nextMsg.reactions.length;
        });

    const channelEqual = prevProps.channel?.id === nextProps.channel?.id;
    
    return messagesEqual && channelEqual;
}); 