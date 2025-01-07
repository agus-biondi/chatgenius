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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReactionService {
    private final ReactionRepository reactionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChannelService channelService;

    public ReactionDto addReaction(UUID messageId, UUID userId, CreateReactionRequest request) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        User user = userRepository.findById(userId)
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

        return toDto(reactionRepository.save(reaction));
    }

    public void removeReaction(UUID messageId, UUID reactionId, UUID userId) {
        Reaction reaction = reactionRepository.findById(reactionId)
            .orElseThrow(() -> new EntityNotFoundException("Reaction not found"));

        // Check if reaction belongs to message
        if (!reaction.getMessage().getId().equals(messageId)) {
            throw new IllegalArgumentException("Reaction does not belong to this message");
        }

        // Only reaction creator can remove it
        if (!reaction.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Only reaction creator can remove it");
        }

        reactionRepository.delete(reaction);
    }

    public ReactionDto toDto(Reaction reaction) {
        ReactionDto dto = new ReactionDto();
        dto.setId(reaction.getId());
        dto.setEmoji(reaction.getEmoji());
        dto.setUserId(reaction.getUser().getId());
        dto.setUsername(reaction.getUser().getUsername());
        dto.setCreatedAt(reaction.getCreatedAt());
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