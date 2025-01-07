package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateMessageRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDto;
import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.MessageRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final ChannelService channelService;
    private final ReactionService reactionService;

    public MessageDto createMessage(UUID channelId, UUID userId, CreateMessageRequest request) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Check if user is member of channel
        if (!channelService.isMember(channel, userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        Message message = new Message();
        message.setContent(request.getContent());
        message.setChannel(channel);
        message.setCreatedBy(user);

        // Handle thread/reply
        if (request.getParentMessageId() != null) {
            Message parentMessage = messageRepository.findById(request.getParentMessageId())
                .orElseThrow(() -> new EntityNotFoundException("Parent message not found"));
            
            // Parent message must be in same channel
            if (!parentMessage.getChannel().getId().equals(channelId)) {
                throw new IllegalArgumentException("Parent message must be in the same channel");
            }
            
            message.setParentMessage(parentMessage);
        }

        return toDto(messageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public Page<MessageDto> getChannelMessages(UUID channelId, UUID userId, Pageable pageable) {
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
    public Page<MessageDto> getThreadMessages(UUID messageId, UUID userId, Pageable pageable) {
        Message parentMessage = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        // Check if user is member of channel
        if (!channelService.isMember(parentMessage.getChannel(), userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        return messageRepository.findByParentMessageOrderByCreatedAtAsc(parentMessage, pageable)
            .map(this::toDto);
    }

    public void deleteMessage(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Only message creator, channel creator, or admin can delete
        if (!message.getCreatedBy().getId().equals(userId) && 
            !message.getChannel().getCreatedBy().getId().equals(userId) && 
            user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Not authorized to delete this message");
        }

        messageRepository.delete(message);
    }

    @Transactional(readOnly = true)
    public Page<MessageDto> searchMessages(UUID channelId, UUID userId, String query, Pageable pageable) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        // Check if user is member of channel
        if (!channelService.isMember(channel, userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        return messageRepository.searchMessages(channel, query, pageable)
            .map(this::toDto);
    }

    public MessageDto updateMessage(UUID messageId, UUID userId, CreateMessageRequest request) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new EntityNotFoundException("Message not found"));

        // Only creator can update message
        if (!message.getCreatedBy().getId().equals(userId)) {
            throw new AccessDeniedException("Only message creator can update the message");
        }

        message.setContent(request.getContent());
        return toDto(messageRepository.save(message));
    }

    private MessageDto toDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setContent(message.getContent());
        dto.setChannelId(message.getChannel().getId());
        dto.setCreatedById(message.getCreatedBy().getId());
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