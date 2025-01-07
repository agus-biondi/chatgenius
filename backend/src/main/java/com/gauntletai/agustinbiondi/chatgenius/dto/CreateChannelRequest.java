package com.gauntletai.agustinbiondi.chatgenius.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class CreateChannelRequest {
    @NotBlank(message = "Channel name is required")
    @Pattern(regexp = "^[a-zA-Z0-9_-]{2,50}$", message = "Channel name must be 2-50 characters long and contain only letters, numbers, underscores, and hyphens")
    private String name;

    private boolean isDirectMessage = false;

    @Size(min = 1, message = "At least one member is required")
    private Set<UUID> memberIds;
} 