package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDTO;
import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.ChannelMembership;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelMembershipRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import com.gauntletai.agustinbiondi.chatgenius.websocket.WebSocketEventHandler;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChannelServiceImpl implements ChannelService {

    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final ChannelMembershipRepository membershipRepository;
    private final WebSocketEventHandler webSocketEventHandler;

    @Override
    @Transactional
    public ChannelDTO createChannel(ChannelDTO channelDTO, String userId) {
        log.info("Creating channel with name: {}, creator: {}", channelDTO.getName(), userId);

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        Channel channel = Channel.builder()
                .name(channelDTO.getName())
                .description(channelDTO.getDescription())
                .type(channelDTO.getType())
                .createdBy(creator)
                .build();

        channel = channelRepository.save(channel);
        addMemberInternal(channel, creator);

        if (channelDTO.getMemberIds() != null) {
            Channel finalChannel = channel;
            channelDTO.getMemberIds().stream()
                    .filter(memberId -> !memberId.equals(userId))
                    .forEach(memberId -> {
                        User member = userRepository.findById(memberId)
                                .orElseThrow(() -> new EntityNotFoundException("User not found: " + memberId));
                        addMemberInternal(finalChannel, member);
                    });
        }

        ChannelDTO createdChannel = toDTO(channelRepository.findById(channel.getId())
                .orElseThrow(() -> new EntityNotFoundException("Channel not found after creation")));
        
        webSocketEventHandler.broadcastChannelCreated(createdChannel);
        
        return createdChannel;
    }

    @Override
    @Transactional
    public ChannelDTO updateChannel(UUID channelId, ChannelDTO channelDTO, String userId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found: " + channelId));

        if (!channel.getCreatedBy().getUserId().equals(userId)) {
            throw new AccessDeniedException("Only channel creator can update the channel");
        }

        channel.setName(channelDTO.getName());
        channel.setDescription(channelDTO.getDescription());
        
        return toDTO(channelRepository.save(channel));
    }

    @Override
    @Transactional
    public void deleteChannel(UUID channelId, String userId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found: " + channelId));

        if (!channel.getCreatedBy().getUserId().equals(userId)) {
            throw new AccessDeniedException("Only channel creator can delete the channel");
        }

        ChannelDTO deletedChannel = toDTO(channel);
        channelRepository.delete(channel);
        webSocketEventHandler.broadcastChannelDeleted(deletedChannel);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ChannelDTO> findById(UUID channelId) {
        return channelRepository.findById(channelId).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChannelDTO> findAllPublicChannels() {
        return channelRepository.findByType(Channel.Type.PUBLIC)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChannelDTO> findUserChannels(String userId) {
        return channelRepository.findByMembershipsUserUserId(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addMember(UUID channelId, String userId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found: " + channelId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        if (channel.getType() == Channel.Type.PRIVATE && 
            !channel.getCreatedBy().getUserId().equals(userId)) {
            throw new AccessDeniedException("Cannot join private channel without invitation");
        }

        addMemberInternal(channel, user);
    }

    @Override
    @Transactional
    public void removeMember(UUID channelId, String userId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found: " + channelId));

        if (!channel.getCreatedBy().getUserId().equals(userId)) {
            throw new AccessDeniedException("Only channel creator can remove members");
        }

        membershipRepository.deleteByChannelIdAndUserUserId(channelId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<String> getChannelMembers(UUID channelId) {
        return membershipRepository.findByChannelId(channelId)
                .stream()
                .map(membership -> membership.getUser().getUserId())
                .collect(Collectors.toSet());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserMember(UUID channelId, String userId) {
        return membershipRepository.existsByChannelIdAndUserUserId(channelId, userId);
    }

    @Override
    @Transactional
    public ChannelDTO createDirectMessageChannel(String userId1, String userId2) {
        // Check if DM channel already exists
        Optional<Channel> existingChannel = channelRepository
                .findDirectMessageChannelBetweenUsers(userId1, userId2);
        
        if (existingChannel.isPresent()) {
            return toDTO(existingChannel.get());
        }

        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId1));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId2));

        Channel channel = Channel.builder()
                .name(generateDmChannelName(user1, user2))
                .type(Channel.Type.DIRECT_MESSAGE)
                .createdBy(user1)
                .build();

        channel = channelRepository.save(channel);
        addMemberInternal(channel, user1);
        addMemberInternal(channel, user2);

        return toDTO(channel);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChannelDTO> findPublicAndUserDirectMessageChannels(String userId) {
        log.info("Fetching public channels and DM channels for user: {}", userId);
        return channelRepository.findPublicAndUserDirectMessageChannels(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private void addMemberInternal(Channel channel, User user) {
        if (!membershipRepository.existsByChannelAndUserUserId(channel, user.getUserId())) {
            ChannelMembership membership = new ChannelMembership();
            membership.setChannel(channel);
            membership.setUser(user);
            membershipRepository.save(membership);
        }
    }

    private String generateDmChannelName(User user1, User user2) {
        return String.format("DM:%s:%s", user1.getUsername(), user2.getUsername());
    }

    private ChannelDTO toDTO(Channel channel) {
        Set<String> memberIds = channel.getMemberships().stream()
                .map(membership -> membership.getUser().getUserId())
                .collect(Collectors.toSet());

        return ChannelDTO.builder()
                .id(channel.getId())
                .name(channel.getName())
                .description(channel.getDescription())
                .type(channel.getType())
                .createdBy(channel.getCreatedBy().getUserId())
                .createdAt(channel.getCreatedAt())
                .memberIds(memberIds)
                .build();
    }
} 