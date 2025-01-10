package com.gauntletai.agustinbiondi.chatgenius.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @NotBlank
    private String username;
} 