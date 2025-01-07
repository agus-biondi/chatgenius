package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class MessageReactionDto {
    private UUID userId;
    private String username;
    private String emoji;
    private Instant createdAt;
} 