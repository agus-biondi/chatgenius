package com.gauntletai.agustinbiondi.chatgenius.dto;

import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserDto {
    private UUID id;
    private String username;
    private String email;
    private UserRole role;
    private LocalDateTime createdAt;
} 