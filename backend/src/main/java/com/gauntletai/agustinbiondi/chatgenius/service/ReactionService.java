package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateReactionRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.NotificationDto;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.Reaction;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.repository.MessageRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ReactionRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.gauntletai.agustinbiondi.chatgenius.dto.WebSocketEventDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.WebSocketEventDto.EventType;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ReactionService {
    private static final Logger log = LoggerFactory.getLogger(ReactionService.class);
    private final ReactionRepository reactionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChannelService channelService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void addReaction(UUID messageId, String userId, CreateReactionRequest request) {
        log.debug("Adding reaction. messageId={}, userId={}, emoji={}", messageId, userId, request.getEmoji());
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));
        log.debug("Found message: {}", message);
        log.debug("Message ID: {}", message.getId());

        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Check if user is member of channel
        if (!channelService.isMember(message.getChannel(), userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        // Check if reaction already exists
        if (reactionRepository.existsByMessageAndUserAndEmoji(message, user, request.getEmoji())) {
            throw new IllegalStateException("Reaction already exists");
        }

        Reaction reaction = new Reaction();
        reaction.setEmoji(request.getEmoji());
        reaction.setMessage(message);
        reaction.setUser(user);

        // Save the reaction
        Reaction savedReaction = reactionRepository.save(reaction);
        log.debug("Saved reaction: {}", savedReaction);
        log.debug("Saved reaction's message ID: {}", savedReaction.getMessage().getId());
        
        // Create DTO for WebSocket
        ReactionDto reactionDto = toDto(savedReaction);
        
        // Send full reaction data to channel subscribers
        String channelTopic = "/topic/channel/" + message.getChannel().getId();
        Map<String, Object> payload = new HashMap<>();
        payload.put("reaction", reactionDto);
        
        WebSocketEventDto event = WebSocketEventDto.builder()
            .type(EventType.REACTION_ADD)
            .channelId(message.getChannel().getId())
            .messageId(messageId)
            .entityId(savedReaction.getId())
            .userId(userId)
            .timestamp(savedReaction.getCreatedAt())
            .payload(payload)
            .build();
            
        messagingTemplate.convertAndSend(channelTopic, event);

        // Send light notification to all users
        WebSocketEventDto notification = WebSocketEventDto.builder()
            .type(EventType.NOTIFICATION)
            .channelId(message.getChannel().getId())
            .messageId(messageId)
            .userId(userId)
            .timestamp(savedReaction.getCreatedAt())
            .build();
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void publishReaction(ReactionDto reactionDto, UUID channelId) {
        // Broadcast the reaction to WebSocket subscribers
        String destination = "/topic/channel/" + channelId;
        log.debug("Reaction DTO before publishing: {}", reactionDto);
        messagingTemplate.convertAndSend(destination, reactionDto);
        log.debug("Published reaction: {}", reactionDto);
    }

    public void removeReaction(UUID messageId, UUID reactionId, String userId) {
        Reaction reaction = reactionRepository.findById(reactionId)
            .orElseThrow(() -> new EntityNotFoundException("Reaction not found"));

        // Check if reaction belongs to message
        if (!reaction.getMessage().getId().equals(messageId)) {
            throw new IllegalArgumentException("Reaction does not belong to this message");
        }

        // Only reaction creator can remove it
        if (!reaction.getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("Only reaction creator can remove it");
        }

        // Create event before deletion
        Map<String, Object> payload = new HashMap<>();
        payload.put("emoji", reaction.getEmoji());
        
        WebSocketEventDto event = WebSocketEventDto.builder()
            .type(EventType.REACTION_REMOVE)
            .channelId(reaction.getMessage().getChannel().getId())
            .messageId(messageId)
            .entityId(reactionId)
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .payload(payload)
            .build();

        // Delete the reaction
        reactionRepository.delete(reaction);

        // Send deletion notification to channel subscribers
        String channelTopic = "/topic/channel/" + reaction.getMessage().getChannel().getId();
        messagingTemplate.convertAndSend(channelTopic, event);
    }

    public ReactionDto toDto(Reaction reaction) {
        ReactionDto dto = new ReactionDto();
        dto.setId(reaction.getId());
        dto.setEmoji(reaction.getEmoji());
        dto.setUserId(reaction.getUser().getUserId());
        dto.setUsername(reaction.getUser().getUsername());
        dto.setCreatedAt(reaction.getCreatedAt());
        
        Message message = reaction.getMessage();
        if (message != null) {
            UUID messageId = message.getId();
            log.debug("Setting messageId in DTO: {}", messageId);
            dto.setMessageId(messageId);
        } else {
            log.warn("Message is null for reaction: {}", reaction.getId());
        }
        
        return dto;
    }

    public List<ReactionDto> findByMessageId(UUID messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));
        return reactionRepository.findByMessage(message)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
} 