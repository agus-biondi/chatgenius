package com.gauntletai.agustinbiondi.chatgenius.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank
    private String userId;

    @NotBlank
    private String username;

    @NotBlank
    @Email
    private String email;
} 