package com.gauntletai.agustinbiondi.chatgenius.dto;

import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDto {
    private String userId;
    private String username;
    private String email;
    private UserRole role;
    private LocalDateTime createdAt;
} 