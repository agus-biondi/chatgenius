package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateMessageRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.WebSocketEventDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.WebSocketEventDto.EventType;
import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.MessageRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.UUID;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final ChannelService channelService;
    private final ReactionService reactionService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createMessage(UUID channelId, String userId, CreateMessageRequest request) {
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        Message message = new Message();
        message.setContent(request.getContent());
        message.setCreatedBy(user);
        message.setChannel(channel);

        if (request.getParentMessageId() != null) {
            Message parentMessage = messageRepository.findById(request.getParentMessageId())
                .orElseThrow(() -> new EntityNotFoundException("Parent message not found"));
            message.setParentMessage(parentMessage);
        }

        // Save the message and ensure transaction is committed
        Message savedMessage = messageRepository.save(message);
        messageRepository.flush();

        // Reload to get the updated timestamp
        Message refreshedMessage = messageRepository.findById(savedMessage.getId())
            .orElseThrow(() -> new EntityNotFoundException("Message not found after save"));
        
        // Create event for WebSocket
        MessageDto messageDto = toDto(refreshedMessage);
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", messageDto);

        WebSocketEventDto event = WebSocketEventDto.builder()
            .type(EventType.MESSAGE_NEW)
            .channelId(channelId)
            .messageId(refreshedMessage.getId())
            .userId(userId)
            .timestamp(refreshedMessage.getCreatedAt())
            .payload(payload)
            .build();

        // Send WebSocket notification
        String destination = "/topic/channel/" + channelId;
        log.info("Publishing message event to WebSocket topic: {}", destination);
        messagingTemplate.convertAndSend(destination, event);

        // Send light notification for other channels
        WebSocketEventDto notification = WebSocketEventDto.builder()
            .type(EventType.NOTIFICATION)
            .channelId(channelId)
            .messageId(refreshedMessage.getId())
            .userId(userId)
            .timestamp(refreshedMessage.getCreatedAt())
            .build();
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void publishMessage(MessageDto messageDto) {
        // Publish the new message to WebSocket subscribers
        String destination = "/topic/channel/" + messageDto.getChannelId();
        log.info("Publishing WebSocket message to: {}", destination);
        log.debug("Message DTO before publishing: {}", messageDto);
        messagingTemplate.convertAndSend(destination, messageDto);
        log.debug("Published message: {}", messageDto);
    }

    @Transactional(readOnly = true)
    public Page<MessageDto> getChannelMessages(UUID channelId, String userId, Pageable pageable) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        // Check if user is member of channel
        if (!channelService.isMember(channel, userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        return messageRepository.findByChannelOrderByCreatedAtDesc(channel, pageable)
            .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<MessageDto> getThreadMessages(UUID messageId, String userId, Pageable pageable) {
        Message parentMessage = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        // Check if user is member of channel
        if (!channelService.isMember(parentMessage.getChannel(), userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        return messageRepository.findByParentMessageOrderByCreatedAtAsc(parentMessage, pageable)
            .map(this::toDto);
    }

    public void deleteMessage(UUID messageId, String userId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Only message creator, channel creator, or admin can delete
        if (!message.getCreatedBy().getUserId().equals(userId) && 
            !message.getChannel().getCreatedBy().getUserId().equals(userId) && 
            user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Not authorized to delete this message");
        }

        // Create event before deletion
        WebSocketEventDto event = WebSocketEventDto.builder()
            .type(EventType.MESSAGE_DELETE)
            .channelId(message.getChannel().getId())
            .messageId(messageId)
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .build();

        // Delete the message
        messageRepository.delete(message);

        // Send WebSocket notification
        String destination = "/topic/channel/" + message.getChannel().getId();
        messagingTemplate.convertAndSend(destination, event);
    }

    @Transactional(readOnly = true)
    public Page<MessageDto> searchMessages(UUID channelId, String userId, String query, Pageable pageable) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        // Check if user is member of channel
        if (!channelService.isMember(channel, userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        return messageRepository.searchMessages(channel, query, pageable)
            .map(this::toDto);
    }

    public MessageDto updateMessage(UUID messageId, String userId, CreateMessageRequest request) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        // Only creator can update message
        if (!message.getCreatedBy().getUserId().equals(userId)) {
            throw new AccessDeniedException("Only message creator can update the message");
        }

        message.setContent(request.getContent());
        Message updatedMessage = messageRepository.save(message);
        MessageDto messageDto = toDto(updatedMessage);
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", messageDto);

        WebSocketEventDto event = WebSocketEventDto.builder()
            .type(EventType.MESSAGE_EDIT)
            .channelId(message.getChannel().getId())
            .messageId(messageId)
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .payload(payload)
            .build();

        String destination = "/topic/channel/" + message.getChannel().getId();
        messagingTemplate.convertAndSend(destination, event);

        return messageDto;
    }

    private MessageDto toDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setContent(message.getContent());
        dto.setChannelId(message.getChannel().getId());
        dto.setCreatedById(message.getCreatedBy().getUserId());
        dto.setCreatedByUsername(message.getCreatedBy().getUsername());
        dto.setCreatedAt(message.getCreatedAt());
        
        if (message.getParentMessage() != null) {
            dto.setParentMessageId(message.getParentMessage().getId());
        }
        
        dto.setReplyCount(message.getReplies().size());
        dto.setReactions(message.getReactions().stream()
            .map(reactionService::toDto)
            .collect(Collectors.toList()));
        
        return dto;
    }

} 