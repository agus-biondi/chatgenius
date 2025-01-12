package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionDTO {
    private UUID id;
    private String emoji;
    private String userId;
    private String username;
    private UUID messageId;
} 