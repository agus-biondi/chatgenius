import { Channel } from '../../types';
import { ChannelList } from './ChannelList';
import { CreateChannelButton } from './CreateChannelButton';
import { UserList } from './UserList';

interface SidebarProps {
    channels: Channel[];
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
    currentUser?: { role: string };
    isLoading: boolean;
    onChannelCreated: () => void;
}

export function Sidebar({ 
    channels, 
    selectedChannelId, 
    onSelectChannel, 
    currentUser,
    isLoading,
    onChannelCreated 
}: SidebarProps) {
    return (
        <div className="w-72 flex flex-col terminal-window overflow-hidden">
            <div className="p-4 border-b border-[var(--terminal-green)]">
                <h1 className="text-xl font-bold tracking-wider cursor">ELECTRO_CHAT_9000</h1>
                <div className="text-xs text-[var(--terminal-dim-green)] mt-1">Tomorrow's Communication, Today</div>
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
                        onSelectChannel={onSelectChannel}
                        currentUser={currentUser}
                    />
                    <CreateChannelButton onChannelCreated={onChannelCreated} />
                    <UserList users={[]} /> {/* You'll need to pass actual users here */}
                </div>
            )}
        </div>
    );
} 