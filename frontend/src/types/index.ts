export interface User {
    userId: string;
    username: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

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
    createdAt: string;
    messageId: string | { toString(): string };
}

export interface File {
    id: string;
    filename: string;
    fileUrl: string;
    uploadedById: string;
    uploadedByUsername: string;
    channelId: string;
    uploadedAt: string;
}

// Request Types
export interface CreateChannelRequest {
    name: string;
    isDirectMessage?: boolean;
    memberIds?: string[];
}

export interface CreateMessageRequest {
    channelId: string;
    content: string;
    parentMessageId?: string;
}

export interface CreateReactionRequest {
    emoji: string;
}

export interface CreateUserRequest {
    userId: string;
    username: string;
    email: string;
} 