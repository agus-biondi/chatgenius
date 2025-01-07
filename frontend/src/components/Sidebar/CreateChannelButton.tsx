import { useState, useRef, useEffect } from 'react';
import { channelService } from '../../services/channelService';

interface CreateChannelButtonProps {
    onChannelCreated: () => void;
}

export function CreateChannelButton({ onChannelCreated }: CreateChannelButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isModalOpen) {
            // Focus the input when modal opens
            inputRef.current?.focus();
        }
    }, [isModalOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelName.trim()) return;

        setIsLoading(true);
        try {
            await channelService.createChannel({ 
                name: channelName.trim(),
                isDirectMessage: false,
                memberIds: []
            });
            onChannelCreated();
            setChannelName('');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to create channel:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 border-t border-[var(--terminal-green)]">
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full p-2 border border-[var(--terminal-green)] hover:bg-[var(--terminal-gray)] transition-colors"
            >
                $ mkdir channel
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                    <div className="bg-[var(--terminal-black)] border border-[var(--terminal-green)] p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">$ mkdir channel/</h3>
                        <form onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                placeholder="channel_name"
                                className="w-full p-2 mb-4 bg-[var(--terminal-gray)] border border-[var(--terminal-green)] text-[var(--terminal-green)] placeholder-[var(--terminal-dim-green)]"
                                disabled={isLoading}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 hover:text-[var(--terminal-dim-green)] transition-colors"
                                    disabled={isLoading}
                                >
                                    [ESC]
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-[var(--terminal-green)] hover:bg-[var(--terminal-gray)] transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'mkdir...' : '[ENTER]'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 