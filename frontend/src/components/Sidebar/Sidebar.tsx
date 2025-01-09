import { Channel, User } from '../../types';
import { ChannelList } from './ChannelList';
import { UserList } from './UserList';

interface SidebarProps {
    channels: Channel[];
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
    currentUser?: { 
        role: string; 
        id: string;
        username: string;
    };
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
    // Create users list with current user
    const users: User[] = currentUser ? [
        {
            userId: currentUser.id,
            username: currentUser.username,
            role: currentUser.role,
            isCurrentUser: true
        }
    ] : [];

    return (
        <div className="w-72 flex flex-col terminal-window overflow-hidden">
            <div className="p-4 border-b border-[#6edb71]">
                <h1 className="text-xl font-bold tracking-wider text-[#6edb71]">ELECTRO_CHAT_9000</h1>
                <div className="text-xs text-[#9ba8b9] mt-1">Tomorrow's Communication, Today</div>
            </div>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
                    Loading channels...
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto">
                        <ChannelList
                            channels={channels}
                            selectedChannelId={selectedChannelId}
                            onSelectChannel={onSelectChannel}
                            currentUser={currentUser}
                            onChannelCreated={onChannelCreated}
                        />
                    </div>
                    <UserList users={users} />
                </div>
            )}
        </div>
    );
} 