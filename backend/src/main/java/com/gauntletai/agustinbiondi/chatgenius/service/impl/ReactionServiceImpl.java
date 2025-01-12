package com.gauntletai.agustinbiondi.chatgenius.service.impl;

import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDTO;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.Reaction;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.repository.MessageRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ReactionRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import com.gauntletai.agustinbiondi.chatgenius.service.ReactionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Slf4j
@Service
public class ReactionServiceImpl implements ReactionService {

    @Autowired
    private ReactionRepository reactionRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public ReactionDTO addReaction(String userId, UUID messageId, String emoji) {
        log.debug("Adding reaction {} to message {} by user {}", emoji, messageId, userId);
        
        // Find the message and user
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found: " + messageId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        // Check if reaction already exists
        Optional<Reaction> existingReaction = reactionRepository.findByUserUserIdAndMessageIdAndEmoji(userId, messageId, emoji);
        
        // If it exists, delete it (implementing the "delete then insert" approach)
        existingReaction.ifPresent(reaction -> reactionRepository.delete(reaction));

        // Create and save new reaction
        Reaction newReaction = Reaction.builder()
                .emoji(emoji)
                .message(message)
                .user(user)
                .build();

        Reaction savedReaction = reactionRepository.save(newReaction);

        // Convert to DTO and return
        return ReactionDTO.builder()
                .id(savedReaction.getId())
                .emoji(savedReaction.getEmoji())
                .userId(savedReaction.getUser().getUserId())
                .username(savedReaction.getUser().getUsername())
                .messageId(savedReaction.getMessage().getId())
                .build();
    }

    @Override
    @Transactional
    public void removeReaction(String userId, UUID messageId, String emoji) {
        log.debug("Removing reaction {} from message {} by user {}", emoji, messageId, userId);
        
        // Verify the message exists
        if (!messageRepository.existsById(messageId)) {
            throw new EntityNotFoundException("Message not found: " + messageId);
        }

        // Delete the reaction if it exists
        reactionRepository.deleteByUserUserIdAndMessageIdAndEmoji(userId, messageId, emoji);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReactionDTO> getReactionsForMessage(UUID messageId) {
        log.debug("Getting reactions for message {}", messageId);
        
        // Verify the message exists
        if (!messageRepository.existsById(messageId)) {
            throw new EntityNotFoundException("Message not found: " + messageId);
        }

        return reactionRepository.findAllByMessageId(messageId)
                .stream()
                .map(reaction -> ReactionDTO.builder()
                        .id(reaction.getId())
                        .emoji(reaction.getEmoji())
                        .userId(reaction.getUser().getUserId())
                        .username(reaction.getUser().getUsername())
                        .messageId(reaction.getMessage().getId())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, List<ReactionDTO>> getReactionsForMessages(List<UUID> messageIds) {
        log.debug("Getting reactions for messages: {}", messageIds);
        
        // Get all reactions for the messages
        Map<UUID, List<ReactionDTO>> reactionsByMessageId = reactionRepository.findAllByMessageIdIn(messageIds)
                .stream()
                .map(reaction -> ReactionDTO.builder()
                        .id(reaction.getId())
                        .emoji(reaction.getEmoji())
                        .userId(reaction.getUser().getUserId())
                        .username(reaction.getUser().getUsername())
                        .messageId(reaction.getMessage().getId())
                        .build())
                .collect(Collectors.groupingBy(
                    ReactionDTO::getMessageId,
                    Collectors.toList()
                ));
        
        // Initialize empty lists for messages without reactions
        messageIds.forEach(messageId -> 
            reactionsByMessageId.putIfAbsent(messageId, new ArrayList<>())
        );
        
        return reactionsByMessageId;
    }

    @Override
    @Transactional(readOnly = true)
    public long getReactionCount(UUID messageId, String emoji) {
        log.debug("Getting count for reaction {} on message {}", emoji, messageId);
        
        // Verify the message exists
        if (!messageRepository.existsById(messageId)) {
            throw new EntityNotFoundException("Message not found: " + messageId);
        }

        return reactionRepository.countByMessageIdAndEmoji(messageId, emoji);
    }
} 