package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
public class ChannelDto {
    private UUID id;
    private String name;
    private boolean isDirectMessage;
    private String createdById;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private Set<ChannelMemberDto> members;
    private int messageCount;
    private int fileCount;
} 