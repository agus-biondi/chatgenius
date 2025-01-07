package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateReactionRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDto;
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

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

        // Save the reaction and ensure transaction is committed
        log.debug("Saving reaction with message: {}", reaction.getMessage());
        Reaction savedReaction = reactionRepository.save(reaction);
        reactionRepository.flush();

        // Reload to get the updated timestamp and ensure message is loaded
        log.debug("Reloading saved reaction with id: {}", savedReaction.getId());
        Reaction refreshedReaction = reactionRepository.findByIdWithMessage(savedReaction.getId())
            .orElseThrow(() -> new EntityNotFoundException("Reaction not found after save"));
        log.debug("Refreshed reaction message: {}", refreshedReaction.getMessage());
        
        // Send WebSocket notification
        ReactionDto reactionDto = toDto(refreshedReaction);
        log.debug("Created ReactionDto: {}", reactionDto);
        log.debug("ReactionDto fields - id: {}, emoji: {}, userId: {}, username: {}, createdAt: {}, messageId: {}", 
            reactionDto.getId(), 
            reactionDto.getEmoji(), 
            reactionDto.getUserId(), 
            reactionDto.getUsername(), 
            reactionDto.getCreatedAt(), 
            reactionDto.getMessageId()
        );
        String destination = "/topic/channel/" + message.getChannel().getId() + "/reactions";
        log.debug("Publishing reaction to WebSocket topic: {}", destination);
        messagingTemplate.convertAndSend(destination, reactionDto);
        log.debug("Successfully published reaction to WebSocket");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void publishReaction(ReactionDto reactionDto, UUID channelId) {
        // Broadcast the reaction to WebSocket subscribers
        String destination = "/topic/channel/" + channelId + "/reactions";
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

        reactionRepository.delete(reaction);
    }

    public ReactionDto toDto(Reaction reaction) {
        ReactionDto dto = new ReactionDto();
        dto.setId(reaction.getId());
        dto.setEmoji(reaction.getEmoji());
        dto.setUserId(reaction.getUser().getUserId());
        dto.setUsername(reaction.getUser().getUsername());
        dto.setCreatedAt(reaction.getCreatedAt());
        
        Message message = reaction.getMessage();
        log.debug("Message from reaction: {}", message);
        if (message != null) {
            UUID messageId = message.getId();
            log.debug("Setting messageId to: {}", messageId);
            dto.setMessageId(messageId);
        } else {
            log.warn("Message is null for reaction: {}", reaction.getId());
        }
        
        log.debug("Created ReactionDto: {}", dto);
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