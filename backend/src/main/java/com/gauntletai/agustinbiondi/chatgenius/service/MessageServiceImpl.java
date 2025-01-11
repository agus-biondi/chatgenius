package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDTO;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.repository.MessageRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private static final int MAX_MESSAGE_LENGTH = 10000;

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public MessageDTO handleIncomingMessage(MessageDTO messageDto, UUID channelId, String userId) {
        validateMessageContent(messageDto.getContent());
        
        // Fetch user and channel
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found: " + channelId));

        // Create message entity (createdAt will be set by @CreationTimestamp)
        Message message = Message.builder()
                .content(messageDto.getContent())
                .createdBy(user)
                .channel(channel)
                .type(Message.Type.TEXT)
                .isEdited(false)
                .build();

        if (messageDto.getParentId() != null) {
            Message parent = messageRepository.findById(messageDto.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent message not found: " + messageDto.getParentId()));
            message.setParent(parent);
        }

        Message savedMessage = messageRepository.save(message);
        log.debug("Saved message: {}", savedMessage.getId());

        MessageDTO savedMessageDto = convertToDto(savedMessage);
        broadcastMessage(channelId, savedMessageDto);

        return savedMessageDto;
    }

    private void validateMessageContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new ValidationException("Message content cannot be empty");
        }
        if (content.length() > MAX_MESSAGE_LENGTH) {
            throw new ValidationException("Message content exceeds maximum length of " + MAX_MESSAGE_LENGTH);
        }
    }

    private MessageDTO convertToDto(Message message) {
        return MessageDTO.builder()
                .id(message.getId())
                .content(message.getContent())
                .createdBy(message.getCreatedBy().getUserId())
                .channelId(message.getChannel().getId())
                .parentId(message.getParent() != null ? message.getParent().getId() : null)
                .createdAt(message.getCreatedAt())
                .editedAt(message.getEditedAt())
                .isEdited(message.isEdited())
                .build();
    }

    @Async
    protected void broadcastMessage(UUID channelId, MessageDTO message) {
        String destination = "/topic/channels/" + channelId;
        log.debug("Broadcasting message to {}", destination);
        messagingTemplate.convertAndSend(destination, message);
    }
} 