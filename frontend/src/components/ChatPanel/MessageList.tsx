import { Message, Reaction, Channel } from '../../types';
import { useEffect, useRef, useState } from 'react';
import { reactionService } from '../../services/reactionService';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useUser } from '@clerk/clerk-react';

interface MessageListProps {
    messages: Message[];
    channel: Channel | null;
}

export function MessageList({ messages, channel }: MessageListProps) {
    const { user } = useUser();
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

    const handleReaction = async (messageId: string, emoji: string) => {
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
                <div className="flex-1 flex flex-col items-center justify-center h-full gap-2">
                    <div className="text-[#9ba8b9]">$ cat ./messages</div>
                    <div className="text-[#9ba8b9]">cat: ./messages: No such file or directory</div>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {messages.map(message => {
                        const groupedReactions = groupReactions(message.reactions);
                        
                        return (
                            <div key={message.id} className="message group hover:bg-[#1e2532] rounded transition-colors p-2 -mx-2">
                                <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
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
                                    <div className="text-[var(--text-primary)] opacity-80 pl-4 flex-1">
                                        {message.content.split('\n').map((line, i) => (
                                            <div key={i} className="text-[#b8cceb]">{line || '\u00A0'}</div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col justify-center items-end gap-2 min-w-[100px]">
                                        <div className="flex items-center gap-2">
                                            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReaction(message.id, emoji)}
                                                    className={`px-2 rounded border border-[#6edb71] hover:bg-[var(--terminal-gray)] ${
                                                        reactions.some(r => r.userId === user?.id)
                                                            ? 'bg-[var(--terminal-gray)]'
                                                            : 'bg-transparent'
                                                    }`}
                                                >
                                                    {emoji} {reactions.length}
                                                </button>
                                            ))}
                                            <div className="flex items-center gap-1">
                                                {['🐧', '💯', '✅', '👀', '🚀'].map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(message.id, emoji)}
                                                        className="text-[#9ba8b9] hover:text-[#6edb71] opacity-0 group-hover:opacity-100"
                                                    >
                                                        [{emoji}]
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id);
                                                    }}
                                                    className="text-[#9ba8b9] hover:text-[#6edb71] opacity-0 group-hover:opacity-100 emoji-picker-toggle"
                                                >
                                                    [more]
                                                </button>
                                            </div>
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
                                                handleReaction(message.id, emoji.native);
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
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
} 