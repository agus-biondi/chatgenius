import React from 'react';
import { usePublicChannels } from '../services/channelService';
import { useUsers } from '../services/userService';
import { TerminalContainer } from './ui/TerminalContainer';

export const TestDataFetching: React.FC = () => {
  const { data: channels, isLoading: isLoadingChannels } = usePublicChannels();
  const { data: users, isLoading: isLoadingUsers } = useUsers();

  if (isLoadingChannels || isLoadingUsers) {
    return (
      <TerminalContainer className="p-4">
        <div className="text-[var(--text-secondary)]">Loading data...</div>
      </TerminalContainer>
    );
  }

  return (
    <TerminalContainer className="p-4">
      <div className="space-y-6">
        <div>
          <h2 className="text-[var(--terminal-green)] mb-2">$ channels</h2>
          <pre className="text-[var(--text-secondary)]">
            {JSON.stringify(channels, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="text-[var(--terminal-green)] mb-2">$ users</h2>
          <pre className="text-[var(--text-secondary)]">
            {JSON.stringify(users, null, 2)}
          </pre>
        </div>
      </div>
    </TerminalContainer>
  );
}; 