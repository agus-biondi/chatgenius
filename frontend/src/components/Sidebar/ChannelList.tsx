import { Channel } from '../../types';
import { channelService } from '../../services/channelService';
import { useState } from 'react';

interface ChannelListProps {
    channels: Channel[];
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
    currentUser?: { role: string };
}

export function ChannelList({ channels, selectedChannelId, onSelectChannel, currentUser }: ChannelListProps) {
    const isAdmin = currentUser?.role === 'ADMIN';
    const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const handleDelete = async (channel: Channel, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingChannel(channel);
        setDeleteConfirmText('');
    };

    const confirmDelete = async () => {
        if (!deletingChannel) return;
        const expectedCommand = `rm -rf #${deletingChannel.name}`;
        if (deleteConfirmText.toLowerCase() !== expectedCommand.toLowerCase()) {
            setDeleteConfirmText('');
            return;
        }

        try {
            await channelService.deleteChannel(deletingChannel.id);
            window.location.reload();
        } catch (error) {
            console.error('Failed to delete channel:', error);
        } finally {
            setDeletingChannel(null);
            setDeleteConfirmText('');
        }
    };

    return (
        <div className="flex flex-col gap-1 p-4 overflow-y-auto">
            <div className="mb-2 opacity-70 font-bold text-lg">$ ls channels/</div>
            {channels.length === 0 ? (
                <div className="opacity-70">No channels found. Create one below!</div>
            ) : (
                <>
                    {channels.map(channel => (
                        <div
                            key={channel.id}
                            className="flex items-center justify-between group"
                        >
                            <button
                                onClick={() => onSelectChannel(channel.id)}
                                className={`flex-1 p-2 text-left hover:bg-[var(--terminal-gray)] transition-colors ${
                                    selectedChannelId === channel.id ? 'bg-[var(--terminal-gray)]' : ''
                                }`}
                            >
                                {selectedChannelId === channel.id ? '>' : '-'} #{channel.name}
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={(e) => handleDelete(channel, e)}
                                    className="px-2 opacity-0 group-hover:opacity-100 text-[var(--terminal-dim-green)] hover:text-[var(--terminal-green)]"
                                    title="Delete channel"
                                >
                                    [x]
                                </button>
                            )}
                        </div>
                    ))}
                    {deletingChannel && (
                        <div className="mt-4 p-2 border border-[var(--terminal-dim-green)] bg-[var(--terminal-gray)]">
                            <div className="text-[var(--terminal-green)]">
                                $ Warning: This will permanently delete #{deletingChannel.name}
                            </div>
                            <div className="mt-2 text-[var(--text-secondary)]">
                                Type 'rm -rf #{deletingChannel.name}' to confirm:
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[var(--terminal-dim-green)]">$</span>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                                    className="flex-1 bg-transparent border-none outline-none text-[var(--terminal-green)]"
                                    autoFocus
                                />
                            </div>
                            <div className="mt-2 flex justify-end gap-2">
                                <button
                                    onClick={() => setDeletingChannel(null)}
                                    className="text-[var(--text-secondary)] hover:text-[var(--terminal-green)]"
                                >
                                    [cancel]
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="text-[var(--terminal-dim-green)] hover:text-[var(--terminal-green)]"
                                >
                                    [confirm]
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
} 