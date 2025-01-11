import React from 'react';
import { useUsers } from '../services/userService';
import { useChannels } from '../services/channelService';

export const TestDataFetching: React.FC = () => {
  const { data: users, isLoading: usersLoading, isError: usersError } = useUsers();
  const { data: channels, isLoading: channelsLoading, isError: channelsError } = useChannels();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Data Fetching Test</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2">Users</h3>
        {usersLoading && <p>Loading users...</p>}
        {usersError && <p className="text-red-500">Error loading users</p>}
        {users && (
          <ul>
            {users.map(user => (
              <li key={user.id}>{user.username} ({user.email})</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Channels</h3>
        {channelsLoading && <p>Loading channels...</p>}
        {channelsError && <p className="text-red-500">Error loading channels</p>}
        {channels && (
          <ul>
            {channels.map(channel => (
              <li key={channel.id}>{channel.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}; 