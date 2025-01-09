import { Message, Reaction, Channel } from '../../types';
import { useEffect, useRef, useState } from 'react';
import { reactionService } from '../../services/reactionService';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageListProps {
    messages: Message[];
    channel: Channel | null;
}

export function MessageList({ messages, channel }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const handleAddReaction = async (messageId: string, emoji: string) => {
        try {
            await reactionService.addReaction(messageId, { emoji });
            setShowEmojiPicker(null);
        } catch (error) {
            console.error('Failed to add reaction:', error);
        }
    };

    const handleRemoveReaction = async (messageId: string, reactionId: string) => {
        try {
            await reactionService.removeReaction(messageId, reactionId);
        } catch (error) {
            console.error('Failed to remove reaction:', error);
        }
    };

    // Group reactions by emoji
    const groupReactions = (reactions: Reaction[]) => {
        return reactions.reduce((groups, reaction) => {
            const key = reaction.emoji;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(reaction);
            return groups;
        }, {} as Record<string, Reaction[]>);
    };

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

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-[var(--text-secondary)] cursor">
                        No messages yet. Start the conversation...
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {messages.map(message => {
                        const groupedReactions = groupReactions(message.reactions);
                        
                        return (
                            <div key={message.id} className="message group">
                                <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                                    <span className="font-medium flex items-center">
                                        <span className="text-[var(--terminal-green)] font-bold">{message.createdByUsername}</span>
                                        <span className="text-[#c17b85]">@electrochat-9000</span>
                                        <span className="text-[#7b95c1]">#{channel?.name || 'unknown'}</span>
                                    </span>
                                    <span className="opacity-70">
                                        [{formatTimestamp(message.createdAt)}]
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                                            <button
                                                key={emoji}
                                                onClick={() => {
                                                    const myReaction = reactions.find(r => r.userId === 'guest');
                                                    if (myReaction) {
                                                        handleRemoveReaction(message.id, myReaction.id);
                                                    } else {
                                                        handleAddReaction(message.id, emoji);
                                                    }
                                                }}
                                                className={`px-1 text-lg rounded border border-[var(--terminal-dim-green)] hover:bg-[var(--terminal-gray)] ${
                                                    reactions.some(r => r.userId === 'guest')
                                                        ? 'bg-[var(--terminal-gray)]'
                                                        : 'bg-transparent'
                                                }`}
                                            >
                                                {emoji} {reactions.length}
                                            </button>
                                        ))}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id);
                                            }}
                                            className="px-1 text-lg rounded border border-[var(--terminal-dim-green)] hover:bg-[var(--terminal-gray)] opacity-0 group-hover:opacity-100 emoji-picker-toggle"
                                        >
                                            [+]
                                        </button>
                                        {showEmojiPicker === message.id && (
                                            <div 
                                                className="absolute z-10"
                                                style={{ right: 0 }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Picker
                                                    data={data}
                                                    onEmojiSelect={(emoji: any) => {
                                                        handleAddReaction(message.id, emoji.native);
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
                                </div>
                                <div className="text-[var(--text-primary)] opacity-80 pl-4">
                                    {message.content.split('\n').map((line, i) => (
                                        <div key={i}>{line || '\u00A0'}</div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
} 