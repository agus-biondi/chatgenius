// src/components/MainLayout.tsx
import React, { memo } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { withRenderLogging } from '../utils/withRenderLogging';
import { Navbar } from './Navbar';
import { TestDataFetching } from './TestDataFetching';

const MainLayoutBase: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-[var(--terminal-black)]">
      {/* Navbar spans full width with padding */}
      <div className="pt-4 px-8">
        <Navbar />
      </div>

      {/* Content area with sidebar and main content */}
      <div className="flex flex-1 px-8">
        {/* Sidebar */}
        <aside className="w-1/4 bg-[var(--terminal-gray)] p-4 terminal-window">
          <h2 className="text-xl font-bold text-[#6edb71] mb-4">Channels</h2>
          <ul>
            <li className="message"><Link to="/channel/general">#general</Link></li>
            <li className="message"><Link to="/channel/random">#random</Link></li>
            {/* Add more channels as needed */}
          </ul>
          <h2 className="text-xl font-bold text-[#6edb71] mt-6 mb-4">Users</h2>
          <ul>
            <li className="message">user1</li>
            <li className="message">user2</li>
            {/* Add more users as needed */}
          </ul>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {/* Content Outlet */}
          <div className="terminal-window p-4">
            <TestDataFetching />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Apply memo before withRenderLogging
const MemoizedMainLayout = memo(MainLayoutBase);
export const MainLayout = withRenderLogging(MemoizedMainLayout, 'MainLayout');
