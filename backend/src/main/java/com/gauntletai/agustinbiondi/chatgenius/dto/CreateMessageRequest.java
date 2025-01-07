package com.gauntletai.agustinbiondi.chatgenius.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateMessageRequest {
    @NotNull
    private UUID channelId;
    
    @NotBlank
    private String content;
    
    private UUID parentMessageId;
} 