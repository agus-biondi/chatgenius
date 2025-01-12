import React, { useState, useCallback } from 'react';
import { TerminalModal } from '../ui/TerminalModal';
import { TerminalPrompt } from '../ui/TerminalPrompt';
import { TerminalOutput } from '../ui/TerminalOutput';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (name: string) => Promise<void>;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  onCreateChannel
}) => {
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!channelName.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await onCreateChannel(channelName.trim());
      setChannelName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  }, [channelName, isLoading, onCreateChannel, onClose]);

  return (
    <TerminalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Channel"
    >
      <div className="space-y-4">
        <div className="terminal-command">$ cd ./channels/</div>
        <div className="flex items-center space-x-2">
          <span className="text-[var(--terminal-gray)] whitespace-nowrap">$ mkdir</span>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && channelName.trim()) {
                handleSubmit();
              }
            }}
            placeholder="# Enter channel name"
            className="terminal-input"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !channelName.trim()}
            className={`terminal-enter-button ${(isLoading || !channelName.trim()) ? 'terminal-enter-button-disabled' : ''}`}
            title="Press Enter to create channel"
          >↵</button>
        </div>

        {error && (
          <TerminalOutput 
            message={error}
            className="terminal-output-error"
          />
        )}
      </div>
    </TerminalModal>
  );
}; 