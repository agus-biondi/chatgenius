import React, { useState, useCallback } from 'react';
import { ChevronRightIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { TerminalContainer } from '../ui/TerminalContainer';
import { SidebarListItem } from '../ui/SidebarListItem';
import { Channel } from '../../types';

interface RightPanelProps {
  channel: Channel | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function RightPanel({ channel, isExpanded, onToggleExpand }: RightPanelProps) {
  const [filesOpen, setFilesOpen] = useState(true);
  const [threadsOpen, setThreadsOpen] = useState(true);

  const toggleFiles = useCallback(() => {
    setFilesOpen(prev => !prev);
  }, []);

  const toggleThreads = useCallback(() => {
    setThreadsOpen(prev => !prev);
  }, []);

  if (!isExpanded) {
    return (
      <div className="h-full flex items-center">
        <button
          onClick={onToggleExpand}
          className="p-2 text-[var(--terminal-gray)] hover:text-[var(--terminal-green)] transition-colors duration-200"
          aria-label="Expand panel"
        >
          <ChevronDoubleRightIcon className="h-5 w-5 transform rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <TerminalContainer className="w-80 h-full flex">
      <div className="overflow-y-auto flex-1 space-y-8">
        {/* Files Section */}
        <div>
          <h2 className="terminal-command mb-2">$ ls ./files/</h2>
          <button
            onClick={toggleFiles}
            aria-expanded={filesOpen}
            aria-controls="files-list"
            className="terminal-toggle-button"
          >
            {filesOpen ? (
              <ChevronRightIcon className="h-4 w-4 transform rotate-90 transition-transform duration-200" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
            )}
            <span className="terminal-subheading">Files</span>
          </button>

          {filesOpen && (
            <div id="files-list" className="mt-2">
              <div className="pl-4 space-y-2">
                {/* TODO: Implement file list */}
                <div className="terminal-output-info">No files shared yet.</div>
              </div>
            </div>
          )}
        </div>

        {/* Threads Section */}
        <div>
          <h2 className="terminal-command mb-2">$ ls ./threads/</h2>
          <button
            onClick={toggleThreads}
            aria-expanded={threadsOpen}
            aria-controls="threads-list"
            className="terminal-toggle-button"
          >
            {threadsOpen ? (
              <ChevronRightIcon className="h-4 w-4 transform rotate-90 transition-transform duration-200" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
            )}
            <span className="terminal-subheading">Threads</span>
          </button>

          {threadsOpen && (
            <div id="threads-list" className="mt-2">
              <div className="pl-4 space-y-2">
                {/* TODO: Implement thread list */}
                <div className="terminal-output-info">No active threads.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <div className="border-l border-[#6edb71] flex items-center">
        <button
          onClick={onToggleExpand}
          className="p-2 text-[var(--terminal-gray)] hover:text-[var(--terminal-green)] transition-colors duration-200"
          aria-label="Collapse panel"
        >
          <ChevronDoubleRightIcon className="h-5 w-5" />
        </button>
      </div>
    </TerminalContainer>
  );
} 