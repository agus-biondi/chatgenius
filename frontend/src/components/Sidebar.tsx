import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { withRenderLogging } from '../utils/withRenderLogging';
import { Channel } from '../services/channelService';
import { User } from '../services/userService';
import { fetchMessages } from '../services/messageService';
import { logger } from '../utils/logger';

interface SidebarProps {
  channels: Channel[];
  users: User[];
}

const SidebarBase: React.FC<SidebarProps> = ({ channels, users }) => {
  const queryClient = useQueryClient();

  const prefetchMessages = (channelId: string) => {
    //if the messages are already in the cache, don't prefetch them again
    if (!queryClient.getQueryData(['messages', channelId])) {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: ['messages', channelId],
      queryFn: () => fetchMessages(channelId),
    });
    logger.debug('api', `Prefetching messages for channel ${channelId}`);
  };

  return (
    <aside className="w-1/4 bg-[var(--terminal-gray)] p-4 terminal-component">
      <h2 className="text-xl font-bold text-[#6edb71] mb-4">Channels</h2>
      <ul>
        {channels.map((channel) => (
          <li key={channel.id} className="message">
            <Link
              to={`/channel/${channel.id}`}
              onMouseDown={() => prefetchMessages(channel.id)}
            >
              #{channel.name}
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="text-xl font-bold text-[#6edb71] mt-6 mb-4">Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="message">
            {user.username}
          </li>
        ))}
      </ul>
    </aside>
  );
};

// Apply memo before withRenderLogging
const MemoizedSidebar = memo(SidebarBase);
export const Sidebar = withRenderLogging(MemoizedSidebar, 'Sidebar'); 