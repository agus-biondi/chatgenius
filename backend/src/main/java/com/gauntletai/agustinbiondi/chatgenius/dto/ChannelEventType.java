package com.gauntletai.agustinbiondi.chatgenius.dto;

public enum ChannelEventType {
    CHANNEL_CREATE,    // When a new channel is created
    CHANNEL_DELETE,    // When a channel is deleted
    CHANNEL_UPDATE,    // Future: When channel details are updated
    CHANNEL_MEMBER_ADD,    // Future: When a member is added to a channel
    CHANNEL_MEMBER_REMOVE  // Future: When a member is removed from a channel
} 