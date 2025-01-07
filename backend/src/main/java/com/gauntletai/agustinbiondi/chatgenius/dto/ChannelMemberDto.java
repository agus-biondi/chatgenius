package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChannelMemberDto {
    private String userId;
    private String username;
    private LocalDateTime joinedAt;
} 