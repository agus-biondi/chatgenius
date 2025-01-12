import { MessageDTO, Channel } from '../../types';
import { logger } from '../../utils/logger';
import { TerminalCommand } from '../ui/TerminalCommand';
import { TerminalComment } from '../ui/TerminalComment';
import { memo, useMemo, useRef, useEffect } from 'react';
import { MessageListItem } from './MessageListItem';
import { useMessageReactions } from '../../hooks/websocket/useMessageReactions';
import { useChannelMessages } from '../../hooks/chat/useChannelMessages';

interface MessageListProps {
    messages: MessageDTO[];
    channel: Channel | null;
}

const MessageListBase = ({ messages, channel }: MessageListProps) => {
    logger.debug('render', 'MessageList rendered', { messageCount: messages.length });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to new messages
    useChannelMessages({
        channelId: channel?.id || '',
        enabled: !!channel
    });

    const messageIds = useMemo(() => messages.map(m => m.id), [messages]);
    const { reactionsByMessageId, addReaction, removeReaction } = useMessageReactions({
        messageIds: messages.map((message) => message.id),
        enabled: true
    });

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const emptyStateContent = useMemo(() => (
        <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col gap-2">
                <TerminalCommand command={`cd ./channels/${channel?.name}/messages/`} />
                <TerminalCommand command="ls" />
                <TerminalCommand command="" />
                <TerminalComment message="No messages found, send a message to get started..." />
            </div>
        </div>
    ), [channel?.name]);

    const messageItems = useMemo(() => {
        return messages.map((message) => (
            <MessageListItem
                key={message.id}
                message={message}
                channel={channel}
                reactions={reactionsByMessageId[message.id] || []}
                onAddReaction={(emoji) => addReaction(message.id, emoji)}
                onRemoveReaction={(emoji) => removeReaction(message.id, emoji)}
            />
        ));
    }, [messages, reactionsByMessageId, addReaction, removeReaction, channel]);

    return (
        <div className="h-full p-4">
            <div className="flex flex-col gap-2">
                {messages.length === 0 ? emptyStateContent : messageItems}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export const MessageList = memo(MessageListBase);