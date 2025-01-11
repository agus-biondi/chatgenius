import React, { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { withRenderLogging } from '../utils/withRenderLogging';
import { Channel, User } from '../types';
import { fetchMessages } from '../services/messageService';
import { logger } from '../utils/logger';
import { TerminalContainer } from './ui/TerminalContainer';
import { TerminalPrompt } from './ui/TerminalPrompt';
import { TerminalOutput } from './ui/TerminalOutput';
import { useModal } from '../hooks/useModal';
import { CreateChannelModal } from './modals/CreateChannelModal';

interface SidebarProps {
  channels: Channel[];
  users: User[];
}

const SidebarBase: React.FC<SidebarProps> = ({ channels, users }) => {
  const queryClient = useQueryClient();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);
  const createChannelModal = useModal();

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

  const handleCreateChannel = useCallback(async (name: string) => {
    // TODO: Implement channel creation
    console.log('Creating channel:', name);
  }, []);

  return (
    <TerminalContainer className="w-80 h-full">
      <div className="overflow-y-auto h-full space-y-8">
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
              {channels.length === 0 ? (
                <div key="no-channels" className="pl-4 space-y-2">
                  <TerminalOutput message="No channels found." className="terminal-output-info" />
                  <TerminalPrompt
                    command="mkdir # Create new channel"
                    onClick={createChannelModal.openModal}
                  />
                </div>
              ) : (
                <div className="space-y-2 pl-4">
                  {channels.map((channel) => (
                    <Link
                      key={channel.id}
                      to={`/channel/${channel.id}`}
                      onMouseEnter={() => prefetchMessages(channel.id)}
                      className="flex items-center space-x-2 text-[var(--terminal-gray)] hover:text-[var(--terminal-green)] hover:bg-[var(--hover-gray)] px-2 py-1 rounded focus-ring"
                    >
                      <span className="text-[var(--terminal-green)]">&gt;</span>
                      <span>{channel.name}</span>
                    </Link>
                  ))}
                </div>
              )}
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
            <div id="users-list" className="mt-2 space-y-2 pl-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 text-[var(--terminal-gray)] px-2 py-1"
                >
                  <span className="text-[var(--terminal-green)]">&gt;</span>
                  <span>{user.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <CreateChannelModal
        isOpen={createChannelModal.isOpen}
        onClose={createChannelModal.closeModal}
        onCreateChannel={async (channelName) => {
          // TODO: Implement channel creation
          console.log('Creating channel:', channelName);
          createChannelModal.closeModal();
        }}
      />
    </TerminalContainer>
  );
};

// Apply memo before withRenderLogging
const MemoizedSidebar = memo(SidebarBase);
export const Sidebar = withRenderLogging(MemoizedSidebar, 'Sidebar'); 