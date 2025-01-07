package com.gauntletai.agustinbiondi.chatgenius.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ReactionDto {
    private UUID id;
    private String emoji;
    private String userId;
    private String username;
    private LocalDateTime createdAt;
    
    @JsonProperty("messageId")
    private UUID messageId;
} 