import { Channel } from '../../types';
import { channelService } from '../../services/channelService';
import { useState, useRef, useEffect } from 'react';

interface ChannelListProps {
    channels: Channel[];
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
    currentUser?: { 
        role: string; 
        id: string;
        username: string;
    };
    onChannelCreated: () => void;
}

export function ChannelList({ channels, selectedChannelId, onSelectChannel, currentUser, onChannelCreated }: ChannelListProps) {
    const isAdmin = currentUser?.role === 'ADMIN';
    const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isModalOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isModalOpen]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelName.trim()) return;

        if (channels.some(ch => ch.name.toLowerCase() === channelName.trim().toLowerCase())) {
            setError(`touch: cannot create channel '${channelName}': File exists`);
            return;
        }

        setError(null);
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
            setError('touch: cannot create channel: An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const canDeleteChannel = (channel: Channel) => {
        if (!currentUser) return false;
        return isAdmin || channel.createdById === currentUser.id;
    };

    const handleDelete = async (channel: Channel, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingChannel(channel);
        setDeleteConfirmText('');
    };

    const confirmDelete = async () => {
        if (!deletingChannel) return;
        const expectedCommand = `rm -rf ${deletingChannel.name}`;
        if (deleteConfirmText.toLowerCase() !== expectedCommand.toLowerCase()) {
            setDeleteConfirmText('');
            return;
        }

        try {
            await channelService.deleteChannel(deletingChannel.id);
            onChannelCreated();
            setDeletingChannel(null);
            setDeleteConfirmText('');
        } catch (error) {
            console.error('Failed to delete channel:', error);
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
            <div className="mb-2 flex justify-between items-center">
                <div className="text-[#6edb71]">$ ls ./channels/</div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-[#9ba8b9] hover:text-[#6edb71] transition-colors"
                >
                    [mkdir]
                </button>
            </div>
            {channels.length === 0 ? (
                <div className="text-[#9ba8b9]">No channels found. Type [mkdir] to create one</div>
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
                                <span className="text-[#6edb71]">{selectedChannelId === channel.id ? '>' : '-'} {channel.name}</span>
                            </button>
                            {canDeleteChannel(channel) && (
                                <button
                                    onClick={(e) => handleDelete(channel, e)}
                                    className="px-2 opacity-0 group-hover:opacity-100 text-[#9ba8b9] hover:text-[#db6e7a]"
                                    title="Delete channel"
                                >
                                    [rm]
                                </button>
                            )}
                        </div>
                    ))}
                    {deletingChannel && (
                        <div className="mt-4 p-2 border border-[#6edb71] bg-[var(--terminal-gray)]">
                            <div className="text-[#db6e7a]">
                                Warning: This operation cannot be undone.
                            </div>
                            <div className="text-[#b8cceb] mt-2">
                                Type <span className="text-[#db6e7a]">rm -rf {deletingChannel.name}</span> to delete channel.
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[#6edb71]">$</span>
                                <span className="text-[#b8cceb]">cd ./channels/</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[#6edb71]">$</span>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                                    className="flex-1 p-2 bg-[var(--terminal-gray)] text-[#b8cceb] placeholder-[#9ba8b9] outline-none border border-transparent focus:border-[#6edb71] transition-colors"
                                    autoFocus
                                />
                            </div>
                            <div className="mt-2 flex justify-end gap-2">
                                <button
                                    onClick={() => setDeletingChannel(null)}
                                    className="text-[#9ba8b9] hover:text-[#6edb71]"
                                >
                                    [cancel]
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="text-[#9ba8b9] hover:text-[#db6e7a]"
                                >
                                    [enter]
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                    <div className="bg-[var(--terminal-black)] p-6 w-96">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[#6edb71]">$</span>
                                <span className="text-[#b8cceb]">cd ./channels/</span>
                            </div>
                            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#6edb71]">$</span>
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="text-[#b8cceb]">touch</span>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={channelName}
                                            onChange={(e) => {
                                                setChannelName(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder="channel_name"
                                            className="flex-1 p-2 bg-[var(--terminal-gray)] text-[#b8cceb] placeholder-[#9ba8b9] outline-none border border-transparent focus:border-[#6edb71] transition-colors"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <div className="text-[#db6e7a] mt-1">
                                        {error}
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-[#9ba8b9] hover:text-[#6edb71] transition-colors"
                                        disabled={isLoading}
                                    >
                                        [esc]
                                    </button>
                                    <button
                                        type="submit"
                                        className="text-[#b8cceb] hover:text-[#6edb71] transition-colors disabled:opacity-50"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? '[wait]' : '[enter]'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 