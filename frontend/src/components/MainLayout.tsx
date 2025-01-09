import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Sidebar } from './Sidebar/Sidebar';
import { Navbar } from './Navbar/Navbar';
import { ChatPanel } from './ChatPanel/ChatPanel';
import { channelService } from '../services/channelService';
import { userService } from '../services/userService';
import { websocketService } from '../services/websocketService';
import { Channel } from '../types';

export function MainLayout() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user, isLoaded: isUserLoaded } = useUser();

    const fetchChannels = async () => {
        setIsLoading(true);
        try {
            const fetchedChannels = await channelService.getChannels();
            setChannels(fetchedChannels);
            if (fetchedChannels.length > 0 && !selectedChannelId) {
                setSelectedChannelId(fetchedChannels[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch channels:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isUserLoaded && user) {
            console.log('User loaded, initializing services...');
            websocketService.initialize();
            userService.syncUserWithBackend(user).then(() => {
                console.log('User synced with backend, fetching channels...');
                fetchChannels();
            });
        }
        return () => {
            websocketService.disconnect();
        };
    }, [user, isUserLoaded]);

    if (!isUserLoaded) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-[var(--terminal-green)]">Initializing system...</div>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen p-4 gap-4">
            {/* Sidebar */}
            <div className="terminal-window">
                <Sidebar
                    channels={channels}
                    selectedChannelId={selectedChannelId}
                    onSelectChannel={setSelectedChannelId}
                    currentUser={{ 
                        role: user?.unsafeMetadata?.role as string || 'USER',
                        id: user?.id || '',
                        username: user?.username || user?.emailAddresses[0]?.emailAddress || 'Anonymous'
                    }}
                    isLoading={isLoading}
                    onChannelCreated={fetchChannels}
                />
            </div>

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Navbar Container */}
                <div className="terminal-window">
                    <Navbar />
                </div>
                
                {/* Chat Panel Container */}
                <div className="flex-1 terminal-window overflow-hidden">
                    <ChatPanel channelId={selectedChannelId} />
                </div>
            </div>
        </div>
    );
} 