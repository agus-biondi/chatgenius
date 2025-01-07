package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class FileDto {
    private UUID id;
    private String filename;
    private String fileUrl;
    private String uploadedById;
    private String uploadedByUsername;
    private UUID channelId;
    private LocalDateTime uploadedAt;
} 