// src/components/MainLayout.tsx
import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { withRenderLogging } from '../utils/withRenderLogging';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { usePublicChannels } from '../services/channelService';
import { useUsers } from '../services/userService';

const MainLayoutBase: React.FC = () => {
  const { data: channels = [] } = usePublicChannels();
  const { data: users = [] } = useUsers();

  return (
    <div className="flex flex-col h-screen bg-[var(--terminal-black)]">
      {/* Navbar spans full width with padding */}
      <div className="pt-4 px-8">
        <Navbar />
      </div>

      {/* Content area with sidebar and main content */}
      <div className="flex flex-1 gap-8 px-8 py-4">
        {/* Sidebar */}
        <Sidebar channels={channels} users={users} />

        {/* Main Content Area */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Apply memo before withRenderLogging
const MemoizedMainLayout = memo(MainLayoutBase);
export const MainLayout = withRenderLogging(MemoizedMainLayout, 'MainLayout');
