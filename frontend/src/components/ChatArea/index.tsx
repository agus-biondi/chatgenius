import { useEffect, useState } from 'react';
import { Message, Reaction, Channel } from '../../types';
import { messageService } from '../../services/messageService';
import { websocketService } from '../../services/websocketService';
import { channelService } from '../../services/channelService';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Navbar } from './Navbar';

interface ChatAreaProps {
    channelId: string | null;
}

export function ChatArea({ channelId }: ChatAreaProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [channel, setChannel] = useState<Channel | null>(null);

    const handleWebSocketUpdate = (data: Message | Reaction) => {
        console.log('Received WebSocket update:', data);
        console.log('WebSocket update type:', 'content' in data ? 'Message' : 'Reaction');
        console.log('WebSocket update fields:', Object.keys(data));
        
        if ('content' in data) {
            // It's a Message
            console.log('Handling new message:', data);
            handleNewMessage(data);
        } else {
            // It's a Reaction
            console.log('Handling new reaction:', data);
            // Convert UUID to string if needed
            const reaction: Reaction = {
                ...data,
                messageId: data.messageId?.toString() || ''
            };
            handleNewReaction(reaction);
        }
    };

    const handleNewMessage = (message: Message) => {
        console.log('Processing new message:', message);
        setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m.id === message.id)) {
                console.log('Message already exists, skipping:', message.id);
                return prev;
            }
            // Sort messages by creation date, oldest first
            const newMessages = [...prev, message].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            console.log('Updated messages:', newMessages);
            return newMessages;
        });
    };

    const handleNewReaction = (reaction: Reaction) => {
        console.log('Processing new reaction:', reaction);
        const messageIdStr = reaction.messageId?.toString() || '';
        console.log('Reaction messageId:', messageIdStr);
        
        setMessages(prev => {
            console.log('Current messages:', prev);
            return prev.map(message => {
                // Find the message that this reaction belongs to
                if (message.id === messageIdStr) {
                    console.log('Found message for reaction:', message.id);
                    console.log('Current message reactions:', message.reactions);
                    // Add the new reaction or update existing reactions
                    const updatedReactions = [...message.reactions];
                    const existingIndex = updatedReactions.findIndex(r => r.id === reaction.id);
                    if (existingIndex >= 0) {
                        console.log('Updating existing reaction at index:', existingIndex);
                        updatedReactions[existingIndex] = reaction;
                    } else {
                        console.log('Adding new reaction');
                        updatedReactions.push(reaction);
                    }
                    console.log('Updated reactions:', updatedReactions);
                    return { ...message, reactions: updatedReactions };
                }
                return message;
            });
        });
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
                    <Navbar />
                    <MessageList messages={messages} channel={channel} />
                    <MessageInput channelId={channelId} />
                </>
            )}
        </div>
    );
} 