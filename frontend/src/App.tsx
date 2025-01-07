import { useEffect, useState } from 'react';
import { Channel } from './types';
import { channelService } from './services/channelService';
import { ChannelList } from './components/Sidebar/ChannelList';
import { CreateChannelButton } from './components/Sidebar/CreateChannelButton';
import { ChatArea } from './components/ChatArea';

// Temporary user for testing - replace with actual auth later
const TEST_USER = { role: 'ADMIN' };

function App() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
        fetchChannels();
    }, []);

    return (
        <div className="relative min-h-screen bg-[var(--terminal-black)]">
            {/* Circuit board background pattern */}
            <div className="absolute inset-0 circuit-pattern" />
            
            {/* CRT scanline effect */}
            <div className="crt-overlay" />
            
            {/* Main content */}
            <div className="relative flex h-screen p-4 gap-4">
                {/* Sidebar */}
                <div className="w-72 flex flex-col terminal-window overflow-hidden">
                    <div className="p-4 border-b border-[var(--terminal-green)]">
                        <h1 className="text-xl font-bold tracking-wider cursor">ELECTROCHAT_9000</h1>
                        <div className="text-xs text-[var(--terminal-dim-green)] mt-1">Your Communication To Tomorrow, Today</div>
                    </div>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
                            Loading channels...
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0">
                            <ChannelList
                                channels={channels}
                                selectedChannelId={selectedChannelId}
                                onSelectChannel={setSelectedChannelId}
                                currentUser={TEST_USER}
                            />
                            <CreateChannelButton onChannelCreated={fetchChannels} />
                        </div>
                    )}
                </div>

                {/* Chat Area */}
                <div className="flex-1 terminal-window overflow-hidden">
                    <ChatArea channelId={selectedChannelId} />
                </div>
            </div>
        </div>
    );
}

export default App;
