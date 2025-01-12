package com.gauntletai.agustinbiondi.chatgenius.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private UUID id;

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 10000, message = "Message content cannot exceed 10000 characters")
    private String content;

    @NotNull(message = "Created by user ID cannot be null")
    private String createdBy;

    @NotNull(message = "Username cannot be null")
    private String username;

    @NotNull(message = "Channel ID cannot be null")
    private UUID channelId;

    private UUID parentId;

    private String createdAt;

    private String editedAt;

    private boolean isEdited;

    private Set<ReactionDTO> reactions;

    private long replyCount;

    private List<MessageDTO> topReplies;
} 