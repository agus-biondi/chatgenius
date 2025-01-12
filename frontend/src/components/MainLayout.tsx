// src/components/MainLayout.tsx
import React, { memo, useCallback, useState, useMemo } from 'react';
import { withRenderLogging } from '../utils/withRenderLogging';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChatPanel } from './ChatPanel/ChatPanel';
import { usePublicChannels } from '../services/channelService';
import { useUsers } from '../services/userService';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '../utils/logger';
import { Channel } from '../types';
import { useModal } from '../hooks/useModal';
import { CreateChannelModal } from './modals/CreateChannelModal';
import { DeleteChannelModal } from './modals/DeleteChannelModal';
import { useCreateChannel, useDeleteChannel } from '../services/channelService';

const MainLayoutBase: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: channels = [] } = usePublicChannels();
  const { data: users = [] } = useUsers();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const createChannelModal = useModal();
  const deleteChannelModal = useModal();
  const createChannelMutation = useCreateChannel();
  const deleteChannelMutation = useDeleteChannel();

  const handleChannelSelect = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
  }, []);

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
      
      // If the deleted channel was selected, select the next available channel
      if (selectedChannel?.id === channelToDelete.id) {
        const currentIndex = channels.findIndex(c => c.id === channelToDelete.id);
        const nextChannel = channels[currentIndex + 1] || channels[currentIndex - 1] || null;
        setSelectedChannel(nextChannel);
      }
      
      setChannelToDelete(null);
    } catch (error) {
      logger.error('state', 'Failed to delete channel', { error });
      throw error;
    }
  }, [deleteChannelMutation, deleteChannelModal, channelToDelete, selectedChannel, channels]);

  const openDeleteModal = useCallback((channel: Channel) => {
    setChannelToDelete(channel);
    deleteChannelModal.openModal();
  }, [deleteChannelModal]);

  // Memoize the ChatPanel props to prevent unnecessary re-renders
  const chatPanelProps = useMemo(() => ({
    channelId: selectedChannel?.id || null,
    channel: selectedChannel
  }), [selectedChannel]);

  // Memoize the Sidebar props
  const sidebarProps = useMemo(() => ({
    channels,
    users,
    onChannelSelect: handleChannelSelect,
    selectedChannel,
    onCreateChannel: createChannelModal.openModal,
    onDeleteChannel: openDeleteModal
  }), [channels, users, handleChannelSelect, selectedChannel, createChannelModal.openModal, openDeleteModal]);

  return (
    <div className="flex flex-col h-screen bg-[var(--terminal-black)]">
      {/* Navbar spans full width with padding */}
      <div className="pt-4 px-8">
        <Navbar />
      </div>

      {/* Content area with sidebar and main content */}
      <div className="flex flex-1 gap-8 px-8 py-4 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar {...sidebarProps} />

        {/* Main Content Area */}
        <main className="flex-1 min-h-0">
          <ChatPanel {...chatPanelProps} />
        </main>
      </div>

      {/* Modals */}
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
    </div>
  );
}

// Apply memo before withRenderLogging
const MemoizedMainLayout = memo(MainLayoutBase);
export const MainLayout = withRenderLogging(MemoizedMainLayout, 'MainLayout');
