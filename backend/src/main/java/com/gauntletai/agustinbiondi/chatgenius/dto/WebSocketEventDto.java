package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;

@Data
@Builder
public class WebSocketEventDto {
    public enum EventType {
        // Message events
        MESSAGE_NEW,
        MESSAGE_EDIT,
        MESSAGE_DELETE,
        
        // Reaction events
        REACTION_ADD,
        REACTION_REMOVE,
        
        // Channel events
        CHANNEL_UPDATE,
        
        // User events
        USER_UPDATE,
        
        // Light notifications
        NOTIFICATION  // For unread indicators, etc.
    }

    private EventType type;
    private UUID channelId;
    private UUID messageId;
    private UUID entityId;  // reactionId, userId, etc.
    private String userId;  // who triggered the event
    private LocalDateTime timestamp;
    private Map<String, Object> payload;  // Flexible payload for different event types
} 