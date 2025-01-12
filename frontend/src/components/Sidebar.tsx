import React, { memo, useState, useCallback } from 'react';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { withRenderLogging } from '../utils/withRenderLogging';
import { Channel, User } from '../types';
import { fetchMessages } from '../services/messageService';
import { logger } from '../utils/logger';
import { TerminalContainer } from './ui/TerminalContainer';
import { TerminalPrompt } from './ui/TerminalPrompt';
import { TerminalOutput } from './ui/TerminalOutput';
import { useChannelEvents } from '../hooks/websocket/useChannelEvents';
import { SidebarListItem } from './ui/SidebarListItem';

interface SidebarProps {
  channels: Channel[];
  users: User[];
  onChannelSelect: (channel: Channel) => void;
  selectedChannel: Channel | null;
  onCreateChannel: () => void;
  onDeleteChannel: (channel: Channel) => void;
}

const SidebarBase: React.FC<SidebarProps> = ({ 
  channels, 
  users, 
  onChannelSelect,
  selectedChannel,
  onCreateChannel,
  onDeleteChannel
}) => {
  const queryClient = useQueryClient();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);

  const handleChannelCreated = useCallback((channel: Channel) => {
    logger.debug('state', 'Channel created event received', { channelId: channel.id });
    // Update the cache directly for all channel-related queries
    const queryKeys = [
      ['channels', 'public'],
      ['channels', 'user'],
      ['channels', 'available']
    ];

    queryKeys.forEach(queryKey => {
      queryClient.setQueryData(queryKey, (old: Channel[] | undefined) => {
        if (!old) return [channel];
        if (old.some(ch => ch.id === channel.id)) return old;
        return [...old, channel];
      });
    });
  }, [queryClient]);

  const handleChannelDeleted = useCallback((channel: Channel) => {
    logger.debug('state', 'Channel deleted event received', { channelId: channel.id });
    // Update the cache directly for all channel-related queries
    const queryKeys = [
      ['channels', 'public'],
      ['channels', 'user'],
      ['channels', 'available']
    ];

    queryKeys.forEach(queryKey => {
      queryClient.setQueryData(queryKey, (old: Channel[] | undefined) => {
        if (!old) return [];
        return old.filter(ch => ch.id !== channel.id);
      });
    });
  }, [queryClient]);

  // Subscribe to channel events
  useChannelEvents({
    onChannelCreated: handleChannelCreated,
    onChannelDeleted: handleChannelDeleted,
  });

  const toggleChannels = useCallback(() => {
    setChannelsOpen(prev => !prev);
  }, []);

  const toggleUsers = useCallback(() => {
    setUsersOpen(prev => !prev);
  }, []);

  const prefetchMessages = useCallback((channelId: string) => {
    if (!queryClient.getQueryData(['messages', channelId])) {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: ['messages', channelId],
      queryFn: () => fetchMessages(channelId),
    });
    logger.debug('api', `Prefetching messages for channel ${channelId}`);
  }, [queryClient]);

  return (
    <TerminalContainer className="w-80 h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-8 p-4">
          {/* Channels Section */}
          <div>
            {/* Command */}
            <h2 className="terminal-command mb-2">$ ls ./channels/</h2>

            {/* Toggle Button */}
            <button
              onClick={toggleChannels}
              aria-expanded={channelsOpen}
              aria-controls="channels-list"
              className="terminal-toggle-button"
            >
              {channelsOpen ? (
                <ChevronRightIcon className="h-4 w-4 transform rotate-90 transition-transform duration-200" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
              )}
              <span className="terminal-subheading">Channels</span>
            </button>

            {channelsOpen && (
              <div id="channels-list" className="mt-2">
                <div className="pl-4 space-y-2">
                  {channels.length === 0 ? (
                    <TerminalOutput key="no-channels" message="No channels found." className="terminal-output-info" />
                  ) : (
                    <div className="space-y-2">
                      {channels.map((channel) => (
                        <SidebarListItem
                          key={channel.id}
                          name={channel.name}
                          onClick={() => onChannelSelect(channel)}
                          onMouseEnter={() => prefetchMessages(channel.id)}
                          showDelete={true}
                          onDelete={() => onDeleteChannel(channel)}
                          isSelected={selectedChannel?.id === channel.id}
                        />
                      ))}
                    </div>
                  )}
                  <TerminalPrompt
                    key="create-channel-btn"
                    command="mkdir # Create new channel"
                    onClick={onCreateChannel}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Users Section */}
          <div>
            {/* Command */}
            <h2 className="terminal-command mb-2">$ ls ./users/</h2>

            {/* Toggle Button */}
            <button
              onClick={toggleUsers}
              aria-expanded={usersOpen}
              aria-controls="users-list"
              className="terminal-toggle-button"
            >
              {usersOpen ? (
                <ChevronRightIcon className="h-4 w-4 transform rotate-90 transition-transform duration-200" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
              )}
              <span className="terminal-subheading">Users</span>
            </button>

            {usersOpen && (
              <div id="users-list" className="mt-2">
                <div className="pl-4 space-y-2">
                  {users.length === 0 ? (
                    <TerminalOutput key="no-users" message="No users found." className="terminal-output-info" />
                  ) : (
                    <div className="pl-4 space-y-2">
                      {users.map((user) => (
                        <SidebarListItem
                          key={user.id}
                          name={user.username}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TerminalContainer>
  );
};

// Apply memo before withRenderLogging
const MemoizedSidebar = memo(SidebarBase);
export const Sidebar = withRenderLogging(MemoizedSidebar, 'Sidebar'); 