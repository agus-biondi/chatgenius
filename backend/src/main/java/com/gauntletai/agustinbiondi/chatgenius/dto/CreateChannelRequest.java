package com.gauntletai.agustinbiondi.chatgenius.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;
import java.util.HashSet;

@Data
public class CreateChannelRequest {
    @NotBlank
    private String name;

    private boolean isDirectMessage = false;

    @NotNull
    private Set<String> memberIds = new HashSet<>();
} 