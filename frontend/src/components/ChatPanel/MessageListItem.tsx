import { MessageDTO, Channel, ReactionDTO } from '../../types';
import { memo, useCallback, useState, useRef, useEffect } from 'react';
import Picker from '@emoji-mart/react';
import { useUser } from '@clerk/clerk-react';

interface MessageListItemProps {
    message: MessageDTO;
    channel: Channel | null;
    reactions: ReactionDTO[];
    onAddReaction: (emoji: string) => void;
    onRemoveReaction: (emoji: string) => void;
}

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', '');
};

const MessageListItemBase: React.FC<MessageListItemProps> = memo(({ message, channel, reactions, onAddReaction, onRemoveReaction }) => {
    const timestamp = formatTimestamp(message.createdAt);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [pickerPosition, setPickerPosition] = useState<'top' | 'bottom'>('bottom');
    const messageRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();

    const handleEmojiSelect = useCallback((emoji: { native: string }) => {
        onAddReaction(emoji.native);
        setShowEmojiPicker(false);
    }, [onAddReaction]);

    const handleReactionClick = useCallback((emoji: string) => {
        const hasReacted = reactions.some(r => r.emoji === emoji);
        if (hasReacted) {
            onRemoveReaction(emoji);
        } else {
            onAddReaction(emoji);
        }
    }, [reactions, onAddReaction, onRemoveReaction]);

    const toggleEmojiPicker = useCallback(() => {
        if (!showEmojiPicker) {
            // Calculate position only when opening
            const rect = messageRef.current?.getBoundingClientRect();
            if (rect) {
                const viewportHeight = window.innerHeight;
                const messageCenter = rect.top + rect.height / 2;
                // If message is in the bottom half of viewport, show picker above
                setPickerPosition(messageCenter > viewportHeight / 2 ? 'top' : 'bottom');
            }
        }
        setShowEmojiPicker(prev => !prev);
    }, []);

    const groupedReactions = reactions.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || []).concat(r);
        return acc;
    }, {} as Record<string, typeof reactions>);

    return (
        <div ref={messageRef} className="flex flex-col gap-1 px-4 py-2 hover:bg-gray-800/50">
            <div className="flex items-center justify-between">
                <span>
                    <span className="text-[var(--terminal-green)]">{message.createdBy}</span>
                    <span className="text-[var(--terminal-red)]">@{channel?.name}</span>
                    <span className="text-[var(--terminal-blue)]">-electro-chat-9000 </span>
                    <span className="text-[var(--terminal-gray)] text-xs">{timestamp}{message.isEdited && " (edited)"}</span>
                </span>
                <div className="relative">
                    <button
                        onClick={toggleEmojiPicker}
                        className="px-2 py-1 rounded hover:bg-gray-700/50"
                    >
                        +
                    </button>
                    {showEmojiPicker && (
                        <div className={`absolute right-0 z-10 ${pickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                            <Picker
                                onEmojiSelect={handleEmojiSelect}
                                theme="dark"
                                previewPosition="none"
                                skinTonePosition="none"
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="pl-4 text-[var(--terminal-gray)]">{message.content}</div>
            <div className="pl-4 flex items-center gap-2">
                {Object.entries(groupedReactions).map(([emoji, users]) => (
                    <button
                        key={emoji}
                        onClick={() => handleReactionClick(emoji)}
                        className={`px-2 py-1 rounded hover:bg-gray-700/50 ${
                            users.some(r => r.userId === user?.id)
                                ? 'bg-gray-700/50'
                                : 'bg-gray-800/50'
                        }`}
                        title={users.map(r => r.username).join(', ')}
                    >
                        {emoji} {users.length}
                    </button>
                ))}
            </div>
        </div>
    );
});

MessageListItemBase.displayName = 'MessageListItemBase';
export const MessageListItem = MessageListItemBase; 