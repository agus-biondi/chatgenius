package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDTO;
import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDTO;
import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.MessageRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private static final int MAX_MESSAGE_LENGTH = 10000;

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;

    private String formatInstant(Instant instant) {
        if (instant == null) {
            log.warn("Received null instant to format");
            return null;
        }
        String isoString = instant.toString();
        log.info("Formatting instant: {} to ISO string: {}", instant, isoString);
        return isoString;
    }

    private MessageDTO toDTO(Message message, String username) {
        log.info("Converting message to DTO - Message ID: {}, Raw createdAt: {}", 
            message.getId(), message.getCreatedAt());
        
        String createdAtStr = formatInstant(message.getCreatedAt());
        String editedAtStr = formatInstant(message.getEditedAt());
        
        log.info("Message {} timestamp conversion - Original: {}, Formatted: {}", 
            message.getId(), message.getCreatedAt(), createdAtStr);
        
        MessageDTO dto = MessageDTO.builder()
                .id(message.getId())
                .content(message.getContent())
                .createdBy(message.getCreatedBy().getUserId())
                .username(username)
                .channelId(message.getChannel().getId())
                .parentId(message.getParent() != null ? message.getParent().getId() : null)
                .createdAt(createdAtStr)
                .editedAt(editedAtStr)
                .isEdited(message.isEdited())
                .reactions(Collections.emptySet())
                .replyCount(0)
                .topReplies(Collections.emptyList())
                .build();
        
        log.info("Created DTO for message {} with createdAt: {}", message.getId(), dto.getCreatedAt());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageDTO> getLatestParentMessagesWithDetails(UUID channelId, Pageable pageable) {
        log.debug("Fetching parent messages for channel: {} with pagination: {}", channelId, pageable);

        // Get authenticated user
        String userId = ((User) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        // Get channel
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found: " + channelId));

        // Check if user has access to channel
        if (channel.getType() != Channel.Type.PUBLIC) {
            boolean isMember = channelRepository.isUserMember(channelId, userId);
            if (!isMember) {
                log.warn("User {} attempted to access messages in private channel {}", userId, channelId);
                throw new AccessDeniedException("You do not have access to this channel");
            }
        }

        // Fetch parent messages with pagination
        Page<Message> parentMessagesPage = messageRepository.findParentMessagesByChannelId(channelId, pageable);

        if (parentMessagesPage.isEmpty()) {
            return Page.empty(pageable);
        }

        // Extract parent message IDs
        List<UUID> parentIds = parentMessagesPage.getContent().stream()
                .map(Message::getId)
                .collect(Collectors.toList());

        // Fetch latest 3 replies for each parent message
        List<Message> replies = messageRepository.findTop3ByParentIdInOrderByCreatedAtDesc(parentIds);

        // Group replies by parent ID
        Map<UUID, List<Message>> repliesByParentId = replies.stream()
                .collect(Collectors.groupingBy(message -> message.getParent().getId()));

        // Map users to avoid fetching multiple times
        Set<String> userIds = new HashSet<>();
        parentMessagesPage.getContent().forEach(m -> userIds.add(m.getCreatedBy().getUserId()));
        replies.forEach(r -> userIds.add(r.getCreatedBy().getUserId()));

        List<User> users = userRepository.findAllById(userIds);
        Map<String, String> userIdToUsername = users.stream()
                .collect(Collectors.toMap(User::getUserId, User::getUsername));

        // Map the content to DTOs while preserving pagination
        return parentMessagesPage.map(parent -> {
            // Map reactions
            Set<ReactionDTO> reactionDTOs = parent.getReactions().stream()
                    .map(reaction -> ReactionDTO.builder()
                            .id(reaction.getId())
                            .emoji(reaction.getEmoji())
                            .userId(reaction.getUser().getUserId())
                            .username(reaction.getUser().getUsername())
                            .messageId(reaction.getMessage().getId())
                            .build())
                    .collect(Collectors.toSet());

            // Map replies
            List<MessageDTO> replyDTOs = repliesByParentId.getOrDefault(parent.getId(), Collections.emptyList())
                    .stream()
                    .map(reply -> toDTO(reply, userIdToUsername.get(reply.getCreatedBy().getUserId())))
                    .collect(Collectors.toList());

            return MessageDTO.builder()
                    .id(parent.getId())
                    .content(parent.getContent())
                    .createdBy(userIdToUsername.get(parent.getCreatedBy().getUserId()))
                    .channelId(parent.getChannel().getId())
                    .parentId(null)
                    .createdAt(formatInstant(parent.getCreatedAt()))
                    .editedAt(formatInstant(parent.getEditedAt()))
                    .isEdited(parent.isEdited())
                    .reactions(reactionDTOs)
                    .replyCount(replies.size())
                    .topReplies(replyDTOs)
                    .build();
        });
    }

    @Override
    @Transactional
    public Message save(Message message) {
        return messageRepository.save(message);
    }

    @Override
    @Transactional
    public MessageDTO handleIncomingMessage(MessageDTO messageDto, UUID channelId, String userId) {
        log.info("Processing incoming message for channel {} from user {}", channelId, userId);
        
        // Validate input parameters
        if (channelId == null) {
            throw new IllegalArgumentException("Channel ID cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        validateMessageContent(messageDto.getContent());

        // Get channel and check access
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found: " + channelId));

        // Check if user is member of private channel
        if (channel.getType() != Channel.Type.PUBLIC) {
            boolean isMember = channelRepository.isUserMember(channelId, userId);
            if (!isMember) {
                log.warn("User {} attempted to send message to private channel {}", userId, channelId);
                throw new AccessDeniedException("You do not have access to this channel");
            }
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        // Create message with explicit timestamp
        Message message = Message.builder()
                .content(messageDto.getContent())
                .channel(channel)
                .createdBy(user)
                .type(Message.Type.TEXT)
                .createdAt(Instant.now()) // Explicitly set the timestamp
                .parent(messageDto.getParentId() != null ? messageRepository.findById(messageDto.getParentId())
                        .orElseThrow(() -> new EntityNotFoundException("Parent message not found: " + messageDto.getParentId()))
                        : null)
                .build();

        try {
            message = messageRepository.save(message);
            // Force a flush to ensure the timestamp is set
            messageRepository.flush();
            log.info("Saved message {} to channel {} with createdAt: {} (raw)", 
                message.getId(), channelId, message.getCreatedAt());
        } catch (Exception e) {
            log.error("Failed to save message to channel {}: {}", channelId, e.getMessage());
            throw new RuntimeException("Failed to save message", e);
        }

        // Convert to DTO and return
        MessageDTO resultDto = toDTO(message, user.getUsername());
        log.info("Returning DTO for message {} with createdAt: {}", 
            resultDto.getId(), resultDto.getCreatedAt());
        return resultDto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageDTO> getLatestParentMessages(UUID channelId) {
        String userId = ((User) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUserId();
        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not founddd: " + userId));

        // Get channel and verify access
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found: " + channelId));

        // Check if user has access to channel
        if (channel.getType() != Channel.Type.PUBLIC) {
            boolean isMember = channelRepository.isUserMember(channelId, userId);
            if (!isMember) {
                log.warn("User {} attempted to access messages in private channel {}", userId, channelId);
                throw new AccessDeniedException("You do not have access to this channel");
            }
        }

        // Get messages with pagination
        Page<Message> messages = messageRepository.findParentMessagesByChannelId(
            channelId, 
            Pageable.ofSize(20)
        );

        // Convert to DTOs
        return messages.map(message -> MessageDTO.builder()
                .id(message.getId())
                .content(message.getContent())
                .createdBy(message.getCreatedBy().getUsername())
                .channelId(message.getChannel().getId())
                .parentId(null) // These are parent messages
                .createdAt(formatInstant(message.getCreatedAt()))
                .editedAt(formatInstant(message.getEditedAt()))
                .isEdited(message.isEdited())
                .reactions(message.getReactions().stream()
                    .map(reaction -> ReactionDTO.builder()
                        .id(reaction.getId())
                        .emoji(reaction.getEmoji())
                        .userId(reaction.getUser().getUserId())
                        .username(reaction.getUser().getUsername())
                        .messageId(reaction.getMessage().getId())
                        .build())
                    .collect(Collectors.toSet()))
                .replyCount(messageRepository.countByParentId(message.getId()))
                .topReplies(Collections.emptyList()) // Not including replies in this view
                .build());
    }

    private void validateMessageContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new ValidationException("Message content cannot be empty");
        }
        if (content.length() > MAX_MESSAGE_LENGTH) {
            throw new ValidationException("Message content cannot exceed " + MAX_MESSAGE_LENGTH + " characters");
        }
    }
} 