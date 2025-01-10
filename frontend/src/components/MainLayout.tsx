import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Sidebar } from './Sidebar/Sidebar';
import { Navbar } from './Navbar/Navbar';
import { ChatPanel } from './ChatPanel/ChatPanel';
import { channelService } from '../services/channelService';
import { userService } from '../services/userService';
import { websocketService } from '../services/websocketService';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
import { Channel, WebSocketEvent } from '../types/index';
import { ChannelWebSocketEvent } from '../types/channelEvents';

function MainLayoutContent() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user, isLoaded: isUserLoaded } = useUser();
    const { setCurrentChannel, incrementUnread } = useNotifications();

    // Extract role outside of memo to prevent unnecessary recreations
    const userRole = user?.unsafeMetadata?.role as string || 'USER';

    // Memoize the current user object with stable dependencies
    const currentUser = useMemo(() => ({
        role: userRole,
        id: user?.id || '',
        username: user?.username || user?.emailAddresses[0]?.emailAddress || 'Anonymous'
    }), [user?.id, user?.username, user?.emailAddresses, userRole]);

    // Memoize channels array to prevent unnecessary re-renders
    const memoizedChannels = useMemo(() => channels, [channels]);

    const fetchChannels = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedChannels = await channelService.getChannels();
            setChannels(prevChannels => {
                // Only update if channels have actually changed
                if (prevChannels.length === fetchedChannels.length && 
                    prevChannels.every(ch => fetchedChannels.some(fch => fch.id === ch.id))) {
                    return prevChannels;
                }
                return fetchedChannels;
            });
        } catch (error) {
            console.error('Failed to fetch channels:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Memoize onChannelCreated to prevent unnecessary Sidebar rerenders
    const onChannelCreated = useCallback(() => {
        console.log('[MainLayout] onChannelCreated called - this should not happen with WebSocket events');
        fetchChannels();
    }, [fetchChannels]);

    // Handle channel selection
    const handleChannelSelect = useCallback((channelId: string) => {
        setSelectedChannelId(channelId);
        setCurrentChannel(channelId);
    }, [setCurrentChannel]);

    // Initialize WebSocket service
    useEffect(() => {
        if (!isUserLoaded || !user?.id) return;
        
        let mounted = true;
        
        const initializeWebSocket = async () => {
            if (!mounted) return;
            console.log('[WebSocket] Initializing WebSocket service...');
            websocketService.initialize();
            
            // Wait for connection before setting up subscriptions
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!mounted) return;
            
            // Set up channel events subscription
            console.log('[WebSocket] Setting up channel event subscription...');
            const cleanupChannelEvents = websocketService.subscribeToChannelEvents(
                (event: ChannelWebSocketEvent) => {
                    if (!mounted) return;
                    handleWebSocketEvent(event);
                }
            );
            
            // Set up user notifications
            const cleanupUserNotifications = websocketService.subscribeToUserNotifications(
                user.id,
                (event: WebSocketEvent) => {
                    if (!mounted) return;
                    handleUserNotification(event);
                }
            );
            
            return () => {
                cleanupChannelEvents();
                cleanupUserNotifications();
            };
        };
        
        const cleanup = initializeWebSocket();
        
        return () => {
            mounted = false;
            cleanup.then(cleanupFn => cleanupFn?.());
            console.log('[WebSocket] Disconnecting WebSocket service...');
            websocketService.disconnect();
        };
    }, [isUserLoaded, user?.id]); // Only reinitialize if user ID changes

    // Separate handler for WebSocket events
    const handleWebSocketEvent = useCallback((event: ChannelWebSocketEvent) => {
        try {
            console.log('[WebSocket] Received channel event:', {
                type: event.type,
                channelId: event.channelId,
                timestamp: new Date(event.timestamp).toISOString(),
                userId: event.userId,
                payload: event.payload
            });

            if (!event.type) {
                console.error('[WebSocket] Invalid event data: missing type', event);
                return;
            }

            switch (event.type) {
                case 'CHANNEL_CREATE': {
                    const channel = event.payload?.channel;
                    if (!channel) {
                        console.error('[WebSocket] Invalid channel creation event: missing channel data', event);
                        return;
                    }
                    setChannels(currentChannels => {
                        if (currentChannels.some(c => c.id === channel.id)) {
                            return currentChannels;
                        }
                        return [...currentChannels, channel];
                    });
                    break;
                }

                case 'CHANNEL_DELETE': {
                    if (!event.channelId) {
                        console.error('[WebSocket] Invalid channel deletion event: missing channelId', event);
                        return;
                    }
                    
                    setChannels(currentChannels => {
                        // If the channel doesn't exist, don't create a new array
                        const channelToDelete = currentChannels.find(c => c.id === event.channelId);
                        if (!channelToDelete) {
                            return currentChannels;
                        }
                        
                        const newChannels = currentChannels.filter(c => c.id !== event.channelId);
                        
                        // Handle selected channel deletion in the same state update
                        if (selectedChannelId === event.channelId && newChannels.length > 0) {
                            // Use queueMicrotask to ensure the state updates happen in the same batch
                            queueMicrotask(() => {
                                handleChannelSelect(newChannels[0].id);
                            });
                        } else if (newChannels.length === 0) {
                            queueMicrotask(() => {
                                setSelectedChannelId(null);
                                setCurrentChannel(null);
                            });
                        }
                        
                        return newChannels;
                    });
                    break;
                }

                default:
                    console.warn('[WebSocket] Unhandled event type:', event.type);
            }
        } catch (error) {
            console.error('[WebSocket] Error handling event:', error);
        }
    }, [selectedChannelId, handleChannelSelect, setCurrentChannel]);

    // Separate handler for user notifications
    const handleUserNotification = useCallback((event: WebSocketEvent) => {
        if (event.type === 'USER_UPDATE') {
            fetchChannels();
        } else if (event.type === 'NOTIFICATION' && event.channelId) {
            incrementUnread(event.channelId);
        }
    }, [fetchChannels, incrementUnread]);

    // Initial data fetch
    useEffect(() => {
        if (!isUserLoaded || !user?.id) return;
        let mounted = true;

        const initializeData = async () => {
            if (!mounted) return;
            setIsLoading(true);
            try {
                await userService.syncUserWithBackend(user);
                const fetchedChannels = await channelService.getChannels();
                if (mounted) {
                    setChannels(fetchedChannels);
                    if (fetchedChannels.length > 0 && !selectedChannelId) {
                        handleChannelSelect(fetchedChannels[0].id);
                    }
                }
            } catch (error) {
                console.error('Error initializing data:', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeData();
        return () => {
            mounted = false;
        };
    }, [isUserLoaded, user?.id, selectedChannelId, handleChannelSelect]);

    return (
        <div className="flex h-screen">
            <Sidebar
                channels={memoizedChannels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={handleChannelSelect}
                isLoading={isLoading}
                currentUser={currentUser}
                onChannelCreated={onChannelCreated}
            />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <div className="flex-1 overflow-hidden">
                    <ChatPanel channelId={selectedChannelId} />
                </div>
            </div>
        </div>
    );
}

export function MainLayout() {
    return (
        <NotificationProvider>
            <MainLayoutContent />
        </NotificationProvider>
    );
} 