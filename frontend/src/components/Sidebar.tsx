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
import { useModal } from '../hooks/useModal';
import { CreateChannelModal } from './modals/CreateChannelModal';
import { DeleteChannelModal } from './modals/DeleteChannelModal';
import { useChannelEvents } from '../hooks/websocket/useChannelEvents';
import { useCreateChannel, useDeleteChannel } from '../services/channelService';
import { SidebarListItem } from './ui/SidebarListItem';

interface SidebarProps {
  channels: Channel[];
  users: User[];
  onChannelsChange?: () => void;
}

const SidebarBase: React.FC<SidebarProps> = ({ channels, users, onChannelsChange }) => {
  const queryClient = useQueryClient();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const createChannelModal = useModal();
  const deleteChannelModal = useModal();
  const createChannelMutation = useCreateChannel();
  const deleteChannelMutation = useDeleteChannel();

  const handleChannelCreated = useCallback((channel: Channel) => {
    logger.debug('state', 'Channel created event received', { channelId: channel.id });
    onChannelsChange?.();
  }, [onChannelsChange]);

  const handleChannelDeleted = useCallback((channel: Channel) => {
    logger.debug('state', 'Channel deleted event received', { channelId: channel.id });
    onChannelsChange?.();
  }, [onChannelsChange]);

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

  const handleCreateChannel = useCallback(async (name: string) => {
    try {
      await createChannelMutation.mutateAsync({
        name,
        type: 'PUBLIC',
        memberIds: []
      });
      createChannelModal.closeModal();
    } catch (error) {
      logger.error('state', 'Failed to create channel', { error });
      throw error;
    }
  }, [createChannelMutation, createChannelModal]);

  const handleDeleteChannel = useCallback(async () => {
    if (!channelToDelete) return;

    try {
      await deleteChannelMutation.mutateAsync(channelToDelete.id);
      deleteChannelModal.closeModal();
      setChannelToDelete(null);
    } catch (error) {
      logger.error('state', 'Failed to delete channel', { error });
      throw error;
    }
  }, [deleteChannelMutation, deleteChannelModal, channelToDelete]);

  const openDeleteModal = useCallback((channel: Channel) => {
    setChannelToDelete(channel);
    deleteChannelModal.openModal();
  }, [deleteChannelModal]);

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
              <div className="pl-4 space-y-2">
                {channels.length === 0 ? (
                  <TerminalOutput key="no-channels" message="No channels found." className="terminal-output-info" />
                ) : (
                  <div className="space-y-2">
                    {channels.map((channel) => (
                      <SidebarListItem
                        key={channel.id}
                        name={channel.name}
                        to={`/channel/${channel.id}`}
                        onMouseEnter={() => prefetchMessages(channel.id)}
                        showDelete={true}
                        onDelete={() => openDeleteModal(channel)}
                      />
                    ))}
                  </div>
                )}
                <TerminalPrompt
                  key="create-channel-btn"
                  command="mkdir # Create new channel"
                  onClick={createChannelModal.openModal}
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
                {users.map((user) => (
                  <SidebarListItem
                    key={user.id}
                    name={user.username}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <CreateChannelModal
        isOpen={createChannelModal.isOpen}
        onClose={createChannelModal.closeModal}
        onCreateChannel={handleCreateChannel}
      />
      {channelToDelete && (
        <DeleteChannelModal
          isOpen={deleteChannelModal.isOpen}
          onClose={() => {
            deleteChannelModal.closeModal();
            setChannelToDelete(null);
          }}
          onDeleteChannel={handleDeleteChannel}
          channelName={channelToDelete.name}
        />
      )}
    </TerminalContainer>
  );
};

// Apply memo before withRenderLogging
const MemoizedSidebar = memo(SidebarBase);
export const Sidebar = withRenderLogging(MemoizedSidebar, 'Sidebar'); 