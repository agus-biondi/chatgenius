import { useChannelMessages } from '../../hooks/chat/useChannelMessages';
import { WebSocketErrorBoundary } from '../../components/error/WebSocketErrorBoundary';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Channel } from '../../types';
import { logger } from '../../utils/logger';

interface ChatPanelProps {
    channelId: string | null;
    channel: Channel | null;
}

export function ChatPanel({ channelId, channel }: ChatPanelProps) {
    const { messages, isLoading, sendMessage } = useChannelMessages({
        channelId: channelId || '',
        onError: (error) => {
            logger.error('state', 'Channel messages error', { error });
        }
    });

    if (!channelId) {
        return (
            <div className="flex-1 flex items-center justify-center text-[#9ba8b9]">
                <div className="flex flex-col items-center gap-2">
                    <div>$ ls ./channels/</div>
                    <div>Please select a channel to start chatting</div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-[#9ba8b9]">
                    <div>$ loading messages...</div>
                    <div className="animate-pulse">Please wait...</div>
                </div>
            </div>
        );
    }

    return (
        <WebSocketErrorBoundary>
            <div className="absolute inset-0 flex flex-col overflow-hidden">
                <div className="absolute inset-0 circuit-pattern pointer-events-none"></div>
                <div className="relative flex-1 min-h-0 overflow-y-auto">
                    <MessageList messages={messages} channel={channel} />
                </div>
                <div className="relative flex-none">
                    <MessageInput 
                        channelId={channelId} 
                        channelName={channel?.name || ''} 
                        onSendMessage={sendMessage}
                    />
                </div>
            </div>
        </WebSocketErrorBoundary>
    );
} 