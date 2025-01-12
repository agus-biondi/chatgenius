import React, { useState, useCallback } from 'react';
import { TerminalModal } from '../ui/TerminalModal';
import { TerminalOutput } from '../ui/TerminalOutput';
import { TerminalComment } from '../ui/TerminalComment';
import { TerminalCommand } from '../ui/TerminalCommand';

interface DeleteChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteChannel: () => Promise<void>;
  channelName: string;
}

export const DeleteChannelModal: React.FC<DeleteChannelModalProps> = ({
  isOpen,
  onClose,
  onDeleteChannel,
  channelName
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleDelete = useCallback(async () => {
    if (isLoading || inputValue !== channelName) return;

    setIsLoading(true);
    setError(null);

    try {
      await onDeleteChannel();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete channel');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onDeleteChannel, onClose, inputValue, channelName]);

  return (
    <TerminalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Channel"
    >
      <div className="space-y-4">
        <TerminalCommand command="cd ./channels/" />
        <TerminalComment message={`# type ${channelName} to confirm`} />
        <div className="flex items-center">
          <div className="flex items-center space-x-2 w-full">
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <span className="terminal-command-prefix">$</span>
              <span className="text-[var(--terminal-gray)]">rm -rf</span>
            </div>
            <div className="flex-grow flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue === channelName) {
                    handleDelete();
                  }
                }}
                placeholder={channelName}
                className="terminal-input w-full"
                autoFocus
              />
              <button
                onClick={handleDelete}
                disabled={isLoading || inputValue !== channelName}
                className={`terminal-enter-button ${isLoading || inputValue !== channelName ? 'terminal-enter-button-disabled' : ''}`}
                title="Press Enter to delete channel"
              >↵</button>
            </div>
          </div>
        </div>

        {error && (
          <TerminalOutput 
            message={error}
            className="terminal-output-error"
          />
        )}

        <TerminalOutput
          message="Warning: This action cannot be undone."
          className="terminal-output-warning"
        />
      </div>
    </TerminalModal>
  );
}; 