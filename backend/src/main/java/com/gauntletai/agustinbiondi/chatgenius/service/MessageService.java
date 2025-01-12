package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDTO;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface MessageService {
    Message save(Message message);
    MessageDTO handleIncomingMessage(MessageDTO messageDto, UUID channelId, String userId);
    Page<MessageDTO> getLatestParentMessagesWithDetails(UUID channelId, Pageable pageable);
    List<MessageDTO> getLatestParentMessages(UUID channelId);
} 