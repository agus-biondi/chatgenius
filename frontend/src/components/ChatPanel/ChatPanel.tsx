import { useEffect, useState } from 'react';
import { Message, Reaction, Channel, WebSocketEvent } from '../../types/index';
import { messageService } from '../../services/messageService';
import { websocketService } from '../../services/websocketService';
import { channelService } from '../../services/channelService';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatPanelProps {
    channelId: string | null;
}

export function ChatPanel({ channelId }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [channel, setChannel] = useState<Channel | null>(null);

    const handleWebSocketUpdate = (data: WebSocketEvent) => {

        switch (data.type) {
            case 'MESSAGE_NEW':
                if (data.payload?.message) {
                    handleNewMessage(data.payload.message);
                }
                break;

            case 'MESSAGE_EDIT':
                if (data.payload?.message) {
                    setMessages(prev => prev.map(msg => 
                        msg.id === data.messageId ? data.payload!.message! : msg
                    ));
                }
                break;

            case 'MESSAGE_DELETE':
                setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
                break;

            case 'REACTION_ADD':
                if (data.payload?.reaction) {
                    handleNewReaction(data.payload.reaction);
                }
                break;

            case 'REACTION_REMOVE':
                if (data.messageId && data.entityId) {
                    handleRemovedReaction(data.messageId, data.entityId);
                }
                break;

            case 'USER_UPDATE':
                if (data.userId && data.payload?.username) {
                    // Update username in all messages and their reactions from this user
                    setMessages(prev => prev.map(msg => {
                        const updatedMsg = msg.createdById === data.userId
                            ? { ...msg, createdByUsername: data.payload!.username! }
                            : msg;

                        // Also update username in reactions
                        const updatedReactions = msg.reactions.map(reaction =>
                            reaction.userId === data.userId
                                ? { ...reaction, username: data.payload!.username! }
                                : reaction
                        );

                        return {
                            ...updatedMsg,
                            reactions: updatedReactions
                        };
                    }));
                }
                break;

            default:
                console.warn('Unknown WebSocket event type:', data.type);
        }
    };

    const handleNewMessage = (message: Message) => {
        setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m.id === message.id)) {
                return prev;
            }
            // Sort messages by creation date, oldest first
            return [...prev, message].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        });
    };

    const handleNewReaction = (reaction: Reaction) => {
        setMessages(prev => prev.map(message => {
            if (message.id === reaction.messageId) {
                const updatedReactions = [...message.reactions];
                const existingIndex = updatedReactions.findIndex(r => r.id === reaction.id);
                
                if (existingIndex >= 0) {
                    updatedReactions[existingIndex] = reaction;
                } else {
                    updatedReactions.push(reaction);
                }
                
                return { ...message, reactions: updatedReactions };
            }
            return message;
        }));
    };

    const handleRemovedReaction = (messageId: string, reactionId: string) => {
        setMessages(prev => prev.map(message => {
            if (message.id === messageId) {
                return {
                    ...message,
                    reactions: message.reactions.filter((r: Reaction) => r.id !== reactionId)
                };
            }
            return message;
        }));
    };

    const fetchMessages = async () => {
        if (!channelId) return;
        
        setIsLoading(true);
        try {
            const response = await messageService.getChannelMessages(channelId);
            // Ensure loading screen shows for at least 500ms
            await new Promise(resolve => setTimeout(resolve, 500));
            // Sort messages by creation date, oldest first
            const sortedMessages = (response || []).sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            // Remove any duplicates by ID
            const uniqueMessages = sortedMessages.filter((message, index, self) =>
                index === self.findIndex(m => m.id === message.id)
            );
            setMessages(uniqueMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchChannel = async () => {
        if (!channelId) return;
        try {
            const channelData = await channelService.getChannel(channelId);
            setChannel(channelData);
        } catch (error) {
            console.error('Failed to fetch channel:', error);
            setChannel(null);
        }
    };

    useEffect(() => {
        console.log('ChatArea: channelId changed to:', channelId);
        setMessages([]);
        setChannel(null);
        
        if (channelId) {
            console.log('ChatArea: Fetching messages and subscribing to channel:', channelId);
            fetchMessages();
            fetchChannel();

            // Subscribe to channel-specific WebSocket events
            const cleanupSubscription = websocketService.subscribeToChannel(
                channelId,
                handleWebSocketUpdate
            );

            return () => {
                console.log('ChatArea: Cleaning up subscriptions for channel:', channelId);
                cleanupSubscription();
            };
        }
    }, [channelId]);

    return (
        <div className="flex flex-col h-full relative z-0">
            {!channelId ? (
                <div className="flex-1 flex items-center justify-center opacity-70">
                    $ select --channel to start chatting
                </div>
            ) : isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="text-[var(--terminal-green)] opacity-70">
                        Loading...
                    </div>
                    {/* Fun loading message for future use
                    <div className="text-[var(--terminal-green)] text-center">
                        <div>"Mom, get off the phone!</div>
                        <div>I'm trying to enable smarter</div>
                        <div>workplace communication with AI!"</div>
                    </div>
                    */}
                </div>
            ) : (
                <>
                    <MessageList messages={messages} channel={channel} />
                    {channel && (
                        <MessageInput 
                            channelId={channel.id} 
                            channelName={channel.name}
                        />
                    )}
                </>
            )}
        </div>
    );
} 