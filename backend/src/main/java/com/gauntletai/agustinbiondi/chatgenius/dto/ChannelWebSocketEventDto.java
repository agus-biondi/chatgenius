package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class ChannelWebSocketEventDto {
    private ChannelEventType type;
    private UUID channelId;  // Optional for CREATE events (will be in payload)
    private String userId;   // User who triggered the event
    private LocalDateTime timestamp;
    private Map<String, Object> payload;  // Contains channel data, error messages, etc.

    // TODO: Future considerations
    // 1. Add sequence number for handling missed events
    // 2. Add version number for handling schema changes
    // 3. Add error handling fields
    // 4. Add batch event support
    // 5. Add support for partial updates
} 