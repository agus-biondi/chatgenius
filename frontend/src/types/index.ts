export type UUID = string;

export interface User {
    id: string;
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
    userId: string;
    username: string;
    createdAt: string;
    editedAt?: string;
    isEdited: boolean;
    parentId?: UUID;
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