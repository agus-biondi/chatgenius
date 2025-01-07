import { Channel } from '../../types';

interface ChannelListProps {
    channels: Channel[];
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
}

export function ChannelList({ channels, selectedChannelId, onSelectChannel }: ChannelListProps) {
    console.log('ChannelList render:', { channels, selectedChannelId });
    return (
        <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
            <div className="mb-2 opacity-70">$ ls channels/</div>
            {channels.length === 0 ? (
                <div className="opacity-70">No channels found. Create one below!</div>
            ) : (
                channels.map(channel => (
                    <button
                        key={channel.id}
                        onClick={() => onSelectChannel(channel.id)}
                        className={`p-2 text-left hover:bg-[var(--terminal-gray)] transition-colors ${
                            selectedChannelId === channel.id ? 'bg-[var(--terminal-gray)]' : ''
                        }`}
                    >
                        {selectedChannelId === channel.id ? '>' : '-'} {channel.name}
                    </button>
                ))
            )}
        </div>
    );
} 