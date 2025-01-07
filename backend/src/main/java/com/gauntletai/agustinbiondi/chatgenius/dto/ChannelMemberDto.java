package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ChannelMemberDto {
    private UUID userId;
    private String username;
    private LocalDateTime joinedAt;
} 