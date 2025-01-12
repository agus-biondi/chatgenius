export type UUID = string;

export interface User {
    userId: string;
    username: string;
    email: string;
    createdAt: string;
}

export interface NotificationDTO {
  id: UUID;
  type: 'MESSAGE' | 'MENTION' | 'CHANNEL_INVITE' | 'SYSTEM';
  title: string;
  content: string;
  channelId?: UUID;
  messageId?: UUID;
  createdAt: string;
  read: boolean;
}

export interface Channel {
    id: UUID;
    name: string;
    description?: string;
    type: 'PUBLIC' | 'PRIVATE' | 'DIRECT_MESSAGE';
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

export interface MessageDTO {
    id: UUID;
    content: string;
    channelId: UUID;
    createdBy: string;
    createdAt: string;
    editedAt?: string;
    isEdited: boolean;
    parentId?: UUID;
    reactions: ReactionDTO[];
    replyCount: number;
    topReplies?: MessageDTO[];
}

export interface CreateChannelRequest {
    name: string;
    description?: string;
    type: 'PUBLIC' | 'PRIVATE' | 'DIRECT_MESSAGE';
    memberIds: string[];
}

export interface CreateMessageRequest {
    content: string;
    parentId?: UUID;
}

export interface ReactionDTO {
    id: string;
    emoji: string;
    userId: string;
    username: string;
    messageId: string;
} 