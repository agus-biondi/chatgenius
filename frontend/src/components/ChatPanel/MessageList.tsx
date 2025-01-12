import { MessageDTO, Channel } from '../../types';
import { logger } from '../../utils/logger';
import { TerminalCommand } from '../ui/TerminalCommand';
import { TerminalComment } from '../ui/TerminalComment';
import { memo, useMemo } from 'react';

interface MessageListProps {
    messages: MessageDTO[];
    channel: Channel | null;
}

const MessageListBase = ({ messages, channel }: MessageListProps) => {
    logger.debug('render', 'MessageList rendered', { messageCount: messages.length });

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

    const messagesList = useMemo(() => (
        messages.map((message) => (
            <div key={message.id} className="message">
                <div className="flex items-center gap-2">
                    <span className="text-[#6edb71] font-bold">{message.username}</span>
                    <span className="text-[#9ba8b9] text-sm">
                        {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                    {message.isEdited && (
                        <span className="text-[#9ba8b9] text-sm">(edited)</span>
                    )}
                    <span className="text-[#9ba8b9] text-xs opacity-50">
                        {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <p className="mt-1 text-[#b8cceb] whitespace-pre-wrap">{message.content}</p>
            </div>
        ))
    ), [messages]);

    return (
        <div className="flex flex-col gap-4 p-4 h-full">
            {messages.length === 0 ? emptyStateContent : messagesList}
        </div>
    );
};

export const MessageList = memo(MessageListBase);