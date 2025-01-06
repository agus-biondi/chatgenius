package com.gauntletai.agustinbiondi.chatgenius.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
public class MessageReaction {
    private UUID userId;
    private String username;  // Denormalized for quick display
    private String emoji;
    private LocalDateTime createdAt = LocalDateTime.now();
} 