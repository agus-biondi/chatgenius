import { Message } from '../../types';

interface MessageListProps {
    messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
    if (!messages) {
        return (
            <div className="flex-1 flex items-center justify-center opacity-70">
                $ loading messages...
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 font-mono">
            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full opacity-70">
                    $ echo "No messages yet. Start the conversation!"
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {messages.map(message => (
                        <div key={message.id} className="flex flex-col">
                            <div className="flex items-center gap-2 opacity-70">
                                <span className="font-semibold">{message.createdByUsername}@chat-genius</span>
                                <span className="text-sm">
                                    [{new Date(message.createdAt).toLocaleTimeString()}]
                                </span>
                                <span>$</span>
                            </div>
                            <p className="pl-4">{message.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 