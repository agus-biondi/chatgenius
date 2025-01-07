package com.gauntletai.agustinbiondi.chatgenius.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@ToString(includeFieldNames = true)
public class ReactionDto {
    private UUID id;
    private String emoji;
    private String userId;
    private String username;
    private LocalDateTime createdAt;
    
    @JsonProperty("messageId")
    @ToString.Include
    private UUID messageId;
} 