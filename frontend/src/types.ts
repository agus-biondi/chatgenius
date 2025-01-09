export interface Channel {
    id: string;
    name: string;
    isDirectMessage: boolean;
    createdById: string;
    createdByUsername: string;
    createdAt: string;
    members: ChannelMember[];
    messageCount: number;
}

export interface ChannelMember {
    userId: string;
    username: string;
    joinedAt: string;
}

export interface User {
    userId: string;
    username: string;
    role: string;
    isCurrentUser: boolean;
}

export interface CreateChannelRequest {
    name: string;
    isDirectMessage?: boolean;
    memberIds?: string[];
} 