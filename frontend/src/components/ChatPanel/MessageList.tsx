import { MessageDTO, Channel } from '../../types';
import { logger } from '../../utils/logger';

interface MessageListProps {
    messages: MessageDTO[];
    channel: Channel | null;
}

export function MessageList({ messages, channel }: MessageListProps) {
    logger.debug('render', 'MessageList rendered', { messageCount: messages.length });

    return (
        <div className="flex flex-col gap-4 p-4">
            {messages.length === 0 ? (
                <div className="text-[#9ba8b9] text-center">
                    <div>$ ls ./messages/</div>
                    <div>No messages found in this channel</div>
                </div>
            ) : (
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
                        </div>
                        <p className="mt-1 text-[#b8cceb] whitespace-pre-wrap">{message.content}</p>
                    </div>
                ))
            )}
        </div>
    );
} 