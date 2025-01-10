import { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Channel, User } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { userService } from '../../services/userService';
import { channelService } from '../../services/channelService';

interface SidebarProps {
    channels: Channel[];
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
    currentUser: {
        role: string;
        id: string;
        username: string;
    };
    isLoading: boolean;
    onChannelCreated: () => void;
}

interface ChannelButtonProps {
    channel: Channel;
    isSelected: boolean;
    unreadCount: number;
    onSelect: (channelId: string) => void;
    onDelete?: (channel: Channel, e: React.MouseEvent) => void;
    canDelete: boolean;
}

const ChannelButton = memo(function ChannelButton({ 
    channel, 
    isSelected, 
    unreadCount, 
    onSelect,
    onDelete,
    canDelete
}: ChannelButtonProps) {
    const handleClick = useCallback(() => {
        onSelect(channel.id);
    }, [channel.id, onSelect]);

    return (
        <div className="flex items-center justify-between group">
            <button
                onClick={handleClick}
                className={`flex-1 p-2 text-left hover:bg-[var(--terminal-gray)] transition-colors ${
                    isSelected ? 'bg-[var(--terminal-gray)]' : ''
                }`}
            >
                <span className="text-[#6edb71]">{isSelected ? '>' : '-'} {channel.name}</span>
                {unreadCount > 0 && (
                    <span className="px-2 py-1 text-xs bg-[#6edb71]/20 text-[#6edb71] rounded-full ml-2">
                        {unreadCount}
                    </span>
                )}
            </button>
            {canDelete && (
                <button
                    onClick={(e) => onDelete?.(channel, e)}
                    className="px-2 opacity-0 group-hover:opacity-100 text-[#9ba8b9] hover:text-[#db6e7a]"
                    title="Delete channel"
                >
                    [rm]
                </button>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.isSelected === nextProps.isSelected &&
           prevProps.unreadCount === nextProps.unreadCount &&
           prevProps.channel.name === nextProps.channel.name &&
           prevProps.canDelete === nextProps.canDelete;
});

const CreateChannelModal = memo(function CreateChannelModal({
    isOpen,
    onClose,
    channelNames,
    onChannelCreated
}: {
    isOpen: boolean;
    onClose: () => void;
    channelNames: string[];
    onChannelCreated: () => void;
}) {
    const [channelName, setChannelName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const [isMouseDownOnBackdrop, setIsMouseDownOnBackdrop] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleBackdropMouseDown = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current) {
            setIsMouseDownOnBackdrop(true);
        }
    };

    const handleBackdropMouseUp = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current && isMouseDownOnBackdrop) {
            onClose();
        }
        setIsMouseDownOnBackdrop(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelName.trim()) return;

        if (channelNames.some(name => name.toLowerCase() === channelName.trim().toLowerCase())) {
            setError(`mkdir: cannot create directory '${channelName}': File exists`);
            return;
        }

        setError(null);
        setIsCreating(true);
        try {
            await channelService.createChannel({ 
                name: channelName.trim(),
                isDirectMessage: false,
                memberIds: []
            });
            setChannelName('');
            onClose();
        } catch (error) {
            setError('mkdir: cannot create directory: An unexpected error occurred');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div 
            ref={backdropRef}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onMouseDown={handleBackdropMouseDown}
            onMouseUp={handleBackdropMouseUp}
        >
            <div className="bg-[var(--terminal-black)] border border-[#6edb71] p-4 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[#6edb71]">$</span>
                        <span className="text-[#b8cceb]">cd ./channels/</span>
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[#6edb71]">$</span>
                            <div className="flex-1 flex items-center gap-2">
                                <span className="text-[#b8cceb]">mkdir</span>
                                <input
                                    type="text"
                                    value={channelName}
                                    onChange={(e) => {
                                        setChannelName(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="channel_name"
                                    className="flex-1 p-2 bg-[var(--terminal-gray)] text-[#b8cceb] placeholder-[#9ba8b9] outline-none border border-transparent focus:border-[#6edb71] transition-colors"
                                    disabled={isCreating}
                                    autoFocus
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
                                onClick={onClose}
                                className="text-[#9ba8b9] hover:text-[#6edb71] transition-colors"
                                disabled={isCreating}
                            >
                                [esc]
                            </button>
                            <button
                                type="submit"
                                className="text-[#b8cceb] hover:text-[#6edb71] transition-colors disabled:opacity-50"
                                disabled={isCreating}
                            >
                                {isCreating ? '[wait]' : '[enter]'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
});

const DeleteChannelModal = memo(function DeleteChannelModal({
    channel,
    onClose,
    onConfirmDelete
}: {
    channel: Channel | null;
    onClose: () => void;
    onConfirmDelete: (channel: Channel) => Promise<void>;
}) {
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const confirmDelete = useCallback(async () => {
        if (!channel) return;
        const expectedCommand = `rm -rf ${channel.name}`;
        if (deleteConfirmText.toLowerCase() !== expectedCommand.toLowerCase()) {
            setDeleteConfirmText('');
            return;
        }

        await onConfirmDelete(channel);
        setDeleteConfirmText('');
    }, [channel, deleteConfirmText, onConfirmDelete]);

    if (!channel) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-[var(--terminal-black)] border border-[#6edb71] p-4 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <div className="text-[#db6e7a]">
                    Warning: This operation cannot be undone.
                </div>
                <div className="text-[#b8cceb] mt-2">
                    Type <span className="text-[#db6e7a]">rm -rf {channel.name}</span> to delete channel.
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
                        onClick={onClose}
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
        </div>,
        document.body
    );
});

export const Sidebar = memo(function Sidebar({
    channels,
    selectedChannelId,
    onSelectChannel,
    currentUser,
    isLoading,
    onChannelCreated
}: SidebarProps) {
    const { state: { unreadCounts } } = useNotifications();
    const [users, setUsers] = useState<User[]>([]);
    const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const canDeleteChannel = useCallback((channel: Channel) => {
        if (!currentUser) return false;
        return currentUser.role === 'ADMIN' || channel.createdById === currentUser.id;
    }, [currentUser]);

    const handleDelete = useCallback((channel: Channel, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingChannel(channel);
    }, []);

    const handleConfirmDelete = useCallback(async (channel: Channel) => {
        try {
            await channelService.deleteChannel(channel.id);
            setDeletingChannel(null);
        } catch (error) {
            console.error('Failed to delete channel:', error);
        }
    }, []);

    // Fetch users only once on mount
    useEffect(() => {
        let mounted = true;
        const fetchUsers = async () => {
            try {
                const activeUsers = await userService.getActiveUsers();
                if (mounted) {
                    setUsers(activeUsers);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        fetchUsers();
        return () => {
            mounted = false;
        };
    }, []);

    // Memoize channel names array
    const channelNames = useMemo(() => channels.map(ch => ch.name), [channels]);

    // Memoize the channel list rendering
    const channelList = useMemo(() => (
        <div className="space-y-2">
            {channels.length === 0 ? (
                <div className="text-[#9ba8b9]">No channels found. Type [mkdir] to create one</div>
            ) : (
                channels.map(channel => (
                    <div key={channel.id}>
                        <ChannelButton
                            channel={channel}
                            isSelected={channel.id === selectedChannelId}
                            unreadCount={unreadCounts[channel.id] || 0}
                            onSelect={onSelectChannel}
                            onDelete={handleDelete}
                            canDelete={canDeleteChannel(channel)}
                        />
                    </div>
                ))
            )}
        </div>
    ), [channels, selectedChannelId, unreadCounts, onSelectChannel, handleDelete, canDeleteChannel]);

    // Memoize the user list rendering
    const userList = useMemo(() => (
        <div className="space-y-2">
            {users.length === 0 ? (
                <div className="text-[#9ba8b9]">No active users</div>
            ) : (
                users.map(user => (
                    <div
                        key={user.userId}
                        className={`p-2 rounded flex items-center ${
                            user.userId === currentUser.id
                                ? 'text-[#6edb71] font-bold'
                                : 'text-[#6edb71]/70'
                        }`}
                    >
                        <span className="text-[#6edb71] mr-2">-</span>
                        {user.username}
                        {user.userId === currentUser.id && ' (you)'}
                    </div>
                ))
            )}
        </div>
    ), [users, currentUser.id]);

    return (
        <div className="w-72 flex flex-col terminal-window overflow-hidden relative">
            <div className="p-4 border-b border-[#6edb71]">
                <h1 className="text-xl font-bold tracking-wider text-[#6edb71]">ELECTRO_CHAT_9000</h1>
                <div className="text-xs text-[#9ba8b9] mt-1">Tomorrow's Communication, Today</div>
            </div>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
                    Loading channels...
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4 border-b border-[#6edb71]/20">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-[#6edb71]">$ ls ./channels/</div>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-[#9ba8b9] hover:text-[#6edb71] transition-colors"
                                >
                                    [mkdir]
                                </button>
                            </div>
                            {channelList}
                        </div>

                        {/* Users Section */}
                        <div className="p-4">
                            <div className="text-[#6edb71] mb-2">$ ls ./users/</div>
                            {userList}
                        </div>
                    </div>
                </div>
            )}

            <DeleteChannelModal 
                channel={deletingChannel}
                onClose={() => setDeletingChannel(null)}
                onConfirmDelete={handleConfirmDelete}
            />

            <CreateChannelModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                channelNames={channelNames}
                onChannelCreated={onChannelCreated}
            />
        </div>
    );
}, (prevProps, nextProps) => {
    const channelsEqual = prevProps.channels === nextProps.channels;
    const selectedEqual = prevProps.selectedChannelId === nextProps.selectedChannelId;
    const loadingEqual = prevProps.isLoading === nextProps.isLoading;
    const userEqual = prevProps.currentUser.id === nextProps.currentUser.id;

    const shouldUpdate = !channelsEqual || !selectedEqual || !loadingEqual || !userEqual;

    if (shouldUpdate) {
        console.log('[Sidebar] Update triggered by:', {
            channelsChanged: !channelsEqual,
            selectedChanged: !selectedEqual,
            loadingChanged: !loadingEqual,
            userChanged: !userEqual
        });
    }

    return !shouldUpdate;
}); 