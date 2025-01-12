import { useChannelMessages } from '../../hooks/chat/useChannelMessages';
import { useLatestParentMessages } from '../../services/messageService';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { RightPanel } from './RightPanel';
import { Channel } from '../../types';
import { logger } from '../../utils/logger';
import { memo, useState } from 'react';
import { TerminalContainer } from '../ui/TerminalContainer';
import { TerminalComment } from '../ui/TerminalComment';

interface ChatPanelProps {
    channelId: string | null;
    channel: Channel | null;
}

const ChatPanelBase = ({ channelId, channel }: ChatPanelProps) => {
    const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false);
    const { data: messages, isLoading } = useLatestParentMessages(channelId || '');
    const { sendMessage } = useChannelMessages({
        channelId: channelId || '',
        onError: (error) => {
            logger.error('state', 'Channel messages error', { error });
        }
    });

    if (!channelId) {
        return (
            <TerminalContainer className="h-full flex">
                <div className="flex-1 flex items-center justify-center">
                    <TerminalComment message=" # Please select a channel from the sidebar to start chatting" />
                </div>
            </TerminalContainer>
        );
    }

    if (isLoading) {
        return (
            <TerminalContainer className="h-full">
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-[#9ba8b9]">
                        <div>$ loading messages...</div>
                        <div className="animate-pulse">Please wait...</div>
                    </div>
                </div>
            </TerminalContainer>
        );
    }

    return (
        <TerminalContainer className="h-[calc(100vh-8rem)] chat-panel">
            <div className="flex h-full">
                <div className={`flex-1 flex flex-col h-full ${isRightPanelExpanded ? 'mr-80' : 'mr-10'}`}>
                    <div className="flex flex-col h-full">
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <MessageList messages={messages?.content || []} channel={channel} />
                        </div>
                        <div className="flex-shrink-0 max-h-[30vh]">
                            <MessageInput 
                                channelId={channelId} 
                                channelName={channel?.name || ''} 
                                onSendMessage={sendMessage} 
                            />
                        </div>
                    </div>
                </div>
                <RightPanel
                    channel={channel}
                    isExpanded={isRightPanelExpanded}
                    onToggleExpand={() => setIsRightPanelExpanded(!isRightPanelExpanded)}
                />
            </div>
        </TerminalContainer>
    );
};

export const ChatPanel = memo(ChatPanelBase); 