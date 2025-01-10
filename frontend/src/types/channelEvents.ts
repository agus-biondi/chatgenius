import { Channel } from './index';

export type ChannelEventType = 
    | 'CHANNEL_CREATE'  // When a new channel is created
    | 'CHANNEL_DELETE'  // When a channel is deleted
    | 'CHANNEL_UPDATE'  // Future: When channel details are updated
    | 'CHANNEL_MEMBER_ADD'    // Future: When a member is added to a channel
    | 'CHANNEL_MEMBER_REMOVE' // Future: When a member is removed from a channel

export interface ChannelWebSocketEvent {
    type: ChannelEventType;
    channelId?: string;  // Optional for CREATE events (will be in payload)
    timestamp: string;
    userId: string;      // User who triggered the event
    payload?: {
        channel?: Channel;
        error?: string;
    };
}

// TODO: Future considerations
// 1. Handle offline/reconnection cases - might need last_updated timestamp
// 2. Handle failed WebSocket delivery - might need event sequence numbers
// 3. Consider batch updates for multiple channels
// 4. Consider caching strategy for channel list
// 5. Handle partial updates vs full channel objects 