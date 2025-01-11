package com.gauntletai.agustinbiondi.chatgenius.dto;

import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelDTO {
    private UUID id;

    @NotBlank(message = "Channel name cannot be empty")
    @Size(min = 3, max = 50, message = "Channel name must be between 3 and 50 characters")
    private String name;

    @Size(max = 255, message = "Channel description cannot exceed 255 characters")
    private String description;

    private Channel.Type type;

    private String createdBy;

    private Instant createdAt;

    private Set<String> memberIds;
} 