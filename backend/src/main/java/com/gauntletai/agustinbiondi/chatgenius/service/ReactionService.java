package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.WebSocketEventDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.WebSocketEventDto.EventType;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.Reaction;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.repository.MessageRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ReactionRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelMembershipRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ReactionService {
    private final ReactionRepository reactionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChannelService channelService;
    private final ChannelMembershipRepository membershipRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ReactionDto addReaction(UUID messageId, String userId, String emoji) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        // Check if user is member of channel
        if (!channelService.isMember(message.getChannel(), userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Check if reaction already exists
        Optional<Reaction> existingReaction = reactionRepository
            .findByMessageAndUserAndEmoji(message, user, emoji);

        if (existingReaction.isPresent()) {
            return toDto(existingReaction.get());
        }

        Reaction reaction = new Reaction();
        reaction.setEmoji(emoji);
        reaction.setUser(user);
        reaction.setMessage(message);

        Reaction savedReaction = reactionRepository.save(reaction);
        reactionRepository.flush();

        ReactionDto reactionDto = toDto(savedReaction);
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

        // Send to channel subscribers
        String channelTopic = String.format("/topic/channel/%s", message.getChannel().getId());
        messagingTemplate.convertAndSend(channelTopic, event);

        // Send notifications to channel members who aren't currently viewing
        membershipRepository.findByChannel(message.getChannel()).stream()
            .map(membership -> membership.getUser().getUserId())
            .filter(memberId -> !memberId.equals(userId)) // Don't notify sender
            .forEach(memberId -> {
                String userTopic = String.format("/topic/user/%s/notifications", memberId);
                WebSocketEventDto notification = WebSocketEventDto.builder()
                    .type(EventType.NOTIFICATION)
                    .channelId(message.getChannel().getId())
                    .messageId(messageId)
                    .userId(userId)
                    .timestamp(savedReaction.getCreatedAt())
                    .build();
                messagingTemplate.convertAndSend(userTopic, notification);
            });

        return reactionDto;
    }

    @Transactional
    public void removeReaction(UUID messageId, UUID reactionId, String userId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        Reaction reaction = reactionRepository.findById(reactionId)
            .orElseThrow(() -> new EntityNotFoundException("Reaction not found"));

        // Check if user owns the reaction
        if (!reaction.getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("User does not own this reaction");
        }

        reactionRepository.delete(reaction);
        reactionRepository.flush();

        WebSocketEventDto event = WebSocketEventDto.builder()
            .type(EventType.REACTION_REMOVE)
            .channelId(message.getChannel().getId())
            .messageId(messageId)
            .entityId(reactionId)
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .build();

        // Send to channel subscribers
        String channelTopic = String.format("/topic/channel/%s", message.getChannel().getId());
        messagingTemplate.convertAndSend(channelTopic, event);
    }

    public ReactionDto toDto(Reaction reaction) {
        ReactionDto dto = new ReactionDto();
        dto.setId(reaction.getId());
        dto.setEmoji(reaction.getEmoji());
        dto.setUserId(reaction.getUser().getUserId());
        dto.setUsername(reaction.getUser().getUsername());
        dto.setCreatedAt(reaction.getCreatedAt());
        dto.setMessageId(reaction.getMessage().getId());
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