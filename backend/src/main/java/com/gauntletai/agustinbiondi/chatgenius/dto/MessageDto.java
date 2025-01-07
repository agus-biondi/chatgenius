package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class MessageDto {
    private UUID id;
    private String content;
    private UUID channelId;
    private UUID createdById;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private UUID parentMessageId;
    private int replyCount;
    private List<ReactionDto> reactions;
} 