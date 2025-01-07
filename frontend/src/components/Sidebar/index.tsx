import { Channel, User } from '../../types';
import { ChannelList } from './ChannelList';
import { CreateChannelButton } from './CreateChannelButton';
import { UserList } from './UserList';
import { useEffect, useState } from 'react';
import { userService } from '../../services/userService';

interface SidebarProps {
    channels: Channel[];
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
    currentUser?: { role: string };
}

export function Sidebar({ channels, selectedChannelId, onSelectChannel, currentUser }: SidebarProps) {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const activeUsers = await userService.getActiveUsers();
                setUsers(activeUsers);
            } catch (error) {
                console.error('Failed to fetch active users:', error);
            }
        };

        fetchUsers();
        // Poll for active users every 30 seconds
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleChannelCreated = () => {
        // Refresh the channels list
        window.location.reload();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-none">
                <ChannelList
                    channels={channels}
                    selectedChannelId={selectedChannelId}
                    onSelectChannel={onSelectChannel}
                    currentUser={currentUser}
                />
                <CreateChannelButton onChannelCreated={handleChannelCreated} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
                <UserList users={users} />
            </div>
        </div>
    );
} 