export interface Channel {
    id: string;
    name: string;
    isDirectMessage: boolean;
    createdById: string;
    createdByUsername: string;
    createdAt: string;
    members: ChannelMember[];
    messageCount: number;
    fileCount: number;
}

export interface ChannelMember {
    userId: string;
    username: string;
    joinedAt: string;
}

export interface Message {
    id: string;
    content: string;
    channelId: string;
    createdById: string;
    createdByUsername: string;
    createdAt: string;
    parentMessageId?: string;
    replyCount: number;
    reactions: Reaction[];
}

export interface Reaction {
    id: string;
    emoji: string;
    userId: string;
    username: string;
    messageId: string;
    createdAt: string;
}

export interface User {
    userId: string;
    username: string;
    role: string;
    createdAt: string;
} 