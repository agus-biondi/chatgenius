package com.gauntletai.agustinbiondi.chatgenius.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateReactionRequest {
    @NotBlank(message = "Emoji is required")
    private String emoji;
} 