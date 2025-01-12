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

    @Override
    @Transactional(readOnly = true)
    public Page<MessageDTO> getLatestParentMessagesWithDetails(UUID channelId, Pageable pageable) {
        log.debug("Fetching parent messages for channel: {} with pagination: {}", channelId, pageable);

        // Get authenticated user
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
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
                    .map(reply -> MessageDTO.builder()
                            .id(reply.getId())
                            .content(reply.getContent())
                            .createdBy(userIdToUsername.get(reply.getCreatedBy().getUserId()))
                            .channelId(reply.getChannel().getId())
                            .parentId(reply.getParent().getId())
                            .createdAt(reply.getCreatedAt())
                            .editedAt(reply.getEditedAt())
                            .isEdited(reply.isEdited())
                            .reactions(Collections.emptySet())
                            .replyCount(0)
                            .topReplies(Collections.emptyList())
                            .build())
                    .collect(Collectors.toList());

            return MessageDTO.builder()
                    .id(parent.getId())
                    .content(parent.getContent())
                    .createdBy(userIdToUsername.get(parent.getCreatedBy().getUserId()))
                    .channelId(parent.getChannel().getId())
                    .parentId(null)
                    .createdAt(parent.getCreatedAt())
                    .editedAt(parent.getEditedAt())
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
        log.debug("Processing incoming message for channel {} from user {}", channelId, userId);
        
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

        // Create and save message
        Message message = Message.builder()
                .content(messageDto.getContent())
                .channel(channel)
                .createdBy(user)
                .type(Message.Type.TEXT)
                .parent(messageDto.getParentId() != null ? messageRepository.findById(messageDto.getParentId())
                        .orElseThrow(() -> new EntityNotFoundException("Parent message not found: " + messageDto.getParentId()))
                        : null)
                .build();

        try {
            message = messageRepository.save(message);
            log.debug("Saved message {} to channel {}", message.getId(), channelId);
        } catch (Exception e) {
            log.error("Failed to save message to channel {}: {}", channelId, e.getMessage());
            throw new RuntimeException("Failed to save message", e);
        }

        // Convert to DTO and return
        return MessageDTO.builder()
                .id(message.getId())
                .content(message.getContent())
                .createdBy(user.getUsername())
                .channelId(channel.getId())
                .parentId(message.getParent() != null ? message.getParent().getId() : null)
                .createdAt(message.getCreatedAt())
                .editedAt(message.getEditedAt())
                .isEdited(message.isEdited())
                .reactions(Collections.emptySet())
                .replyCount(0)
                .topReplies(Collections.emptyList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getLatestParentMessages(UUID channelId) {
        return getLatestParentMessagesWithDetails(channelId, Pageable.ofSize(20)).getContent();
    }

    private void validateMessageContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new ValidationException("Message content cannot be empty");
        }
        if (content.length() > MAX_MESSAGE_LENGTH) {
            throw new ValidationException("Message content exceeds maximum length of " + MAX_MESSAGE_LENGTH);
        }
        // Add additional content validation if needed
        if (content.trim().length() < 1) {
            throw new ValidationException("Message content must contain at least one non-whitespace character");
        }
    }
} 