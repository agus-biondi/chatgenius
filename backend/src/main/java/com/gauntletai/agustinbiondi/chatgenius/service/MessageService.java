package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDTO;

import java.util.UUID;

public interface MessageService {
    MessageDTO handleIncomingMessage(MessageDTO messageDto, UUID channelId, String userId);
} 