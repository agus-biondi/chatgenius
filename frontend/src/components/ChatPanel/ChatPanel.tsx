import { useEffect, useState } from 'react';
import { Message, Reaction, Channel, WebSocketEvent } from '../../types';
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
        console.log('Received WebSocket event:', data);

        // Only process events for current channel
        if (data.channelId !== channelId) {
            // Handle notifications for other channels here if needed
            if (data.type === 'NOTIFICATION') {
                // TODO: Update unread indicators, etc.
                return;
            }
            return;
        }

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
                handleRemovedReaction(data.messageId, data.entityId!, data.payload?.emoji);
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

    const handleRemovedReaction = (messageId: string, reactionId: string, emoji?: string) => {
        setMessages(prev => prev.map(message => {
            if (message.id === messageId) {
                return {
                    ...message,
                    reactions: message.reactions.filter(r => r.id !== reactionId)
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
            // Subscribe to WebSocket updates
            websocketService.subscribeToChannel(channelId, handleWebSocketUpdate);
            
            // Cleanup subscription when changing channels
            return () => {
                console.log('ChatArea: Cleaning up subscriptions for channel:', channelId);
                websocketService.unsubscribeFromChannel(channelId);
            };
        }
    }, [channelId]);

    return (
        <div className="flex flex-col h-full">
            {!channelId ? (
                <div className="flex-1 flex items-center justify-center opacity-70">
                    $ select --channel to start chatting
                </div>
            ) : isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="text-[var(--terminal-green)] opacity-70">
                        $ dialing up...
                    </div>
                    <div className="text-[var(--terminal-green)] text-center">
                        <div>"Mom, get off the phone!</div>
                        <div>I'm trying to enable smarter</div>
                        <div>workplace communication with AI!"</div>
                    </div>
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