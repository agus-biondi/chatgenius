import { useEffect, useState } from 'react';
import { Channel } from './types';
import { channelService } from './services/channelService';
import { ChannelList } from './components/Sidebar/ChannelList';
import { CreateChannelButton } from './components/Sidebar/CreateChannelButton';
import { ChatArea } from './components/ChatArea';

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
        <div className="flex h-screen bg-[var(--terminal-black)] text-[var(--terminal-green)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-[var(--terminal-green)] flex flex-col">
                <div className="p-4 border-b border-[var(--terminal-green)]">
                    <h1 className="text-xl font-bold tracking-wider">CHAT_GENIUS{'>_'}</h1>
                </div>
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center opacity-70">
                        Loading channels...
                    </div>
                ) : (
                    <>
                        <ChannelList
                            channels={channels}
                            selectedChannelId={selectedChannelId}
                            onSelectChannel={setSelectedChannelId}
                        />
                        <CreateChannelButton onChannelCreated={fetchChannels} />
                    </>
                )}
            </div>

            {/* Chat Area */}
            <ChatArea channelId={selectedChannelId} />
        </div>
    );
}

export default App;
