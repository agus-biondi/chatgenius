package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelMemberDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.CreateChannelRequest;
import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.ChannelMembership;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelMembershipRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChannelService {
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final ChannelMembershipRepository membershipRepository;
    private final ChannelWebSocketService channelWebSocketService;

    @Transactional
    public ChannelDto createChannel(String userId, CreateChannelRequest request) {
        log.info("Creating channel with name: {}, creator: {}", request.getName(), userId);
        
        // Check if channel name already exists (for non-DM channels)
        if (!request.isDirectMessage() && channelRepository.existsByNameAndIsDirectMessageFalse(request.getName())) {
            log.warn("Channel name already exists: {}", request.getName());
            throw new IllegalArgumentException("Channel name already exists");
        }

        User creator = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        log.debug("Found creator user: {}", creator.getUsername());

        Channel channel = Channel.builder()
            .name(request.getName())
            .isDirectMessage(request.isDirectMessage())
            .createdBy(creator)
            .build();

        // Save the channel first
        channel = channelRepository.saveAndFlush(channel);
        log.info("Saved channel with ID: {}", channel.getId());

        // Create and save the membership
        ChannelMembership membership = new ChannelMembership();
        membership.setChannel(channel);
        membership.setUser(creator);
        membershipRepository.saveAndFlush(membership);
        log.info("Added creator as member to channel");

        // Add additional members if specified
        for (String memberId : request.getMemberIds()) {
            if (!memberId.equals(userId)) {
                log.debug("Adding member with ID: {} to channel", memberId);
                User member = userRepository.findByUserId(memberId)
                    .orElseThrow(() -> new EntityNotFoundException("Member not found: " + memberId));
                addMemberInternal(channel, member);
            }
        }

        // Refresh the channel to get the updated memberships
        channel = channelRepository.findById(channel.getId())
            .orElseThrow(() -> new EntityNotFoundException("Channel not found after creation"));
        log.info("Successfully created channel with ID: {} and {} members", 
                channel.getId(), channel.getMemberships().size());

        ChannelDto channelDto = toDto(channel);
        
        // Broadcast channel creation event
        channelWebSocketService.broadcastChannelCreated(channelDto, userId);

        return channelDto;
    }

    @Transactional
    public ChannelDto createOrGetDirectMessageChannel(String userId, String otherUserId) {
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        User otherUser = userRepository.findByUserId(otherUserId)
            .orElseThrow(() -> new EntityNotFoundException("Other user not found"));

        // Check if DM channel already exists
        List<Channel> userDmChannels = channelRepository.findAllDirectMessageChannels(user);
        Optional<Channel> existingChannel = userDmChannels.stream()
            .filter(channel -> channel.getMemberships().stream()
                .anyMatch(membership -> membership.getUser().equals(otherUser)))
            .findFirst();

        if (existingChannel.isPresent()) {
            return toDto(existingChannel.get());
        }

        // Create new DM channel
        Channel channel = Channel.builder()
            .name(generateDmChannelName(user, otherUser))
            .isDirectMessage(true)
            .createdBy(user)
            .build();

        channel = channelRepository.save(channel);
        addMemberInternal(channel, user);
        addMemberInternal(channel, otherUser);

        return toDto(channel);
    }

    @Transactional(readOnly = true)
    public Page<ChannelDto> getUserChannels(String userId, Pageable pageable) {
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return channelRepository.findChannelsByMember(user, pageable)
            .map(this::toDto);
    }

    @Transactional
    public void deleteChannel(UUID channelId, String userId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        // Only creator can delete the channel
        if (!channel.getCreatedBy().getUserId().equals(userId)) {
            throw new AccessDeniedException("Only channel creator can delete the channel");
        }

        channelRepository.delete(channel);
        channelRepository.flush();

        // Broadcast channel deletion event
        channelWebSocketService.broadcastChannelDeleted(channelId, userId);
    }

    public void addMember(UUID channelId, String userId, String memberToAddId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));
        
        // Check if requester is a member
        if (!isMember(channel, userId)) {
            throw new AccessDeniedException("Only channel members can add new members");
        }

        User memberToAdd = userRepository.findByUserId(memberToAddId)
            .orElseThrow(() -> new EntityNotFoundException("User to add not found"));

        addMemberInternal(channel, memberToAdd);
    }

    public void removeMember(UUID channelId, String userId, String memberToRemoveId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));
        
        // Only creator or self-removal is allowed
        if (!channel.getCreatedBy().getUserId().equals(userId) && !userId.equals(memberToRemoveId)) {
            throw new AccessDeniedException("Only channel creator can remove members");
        }

        membershipRepository.findByChannelAndUser_UserId(channel, memberToRemoveId)
            .ifPresent(membershipRepository::delete);
    }

    @Transactional(readOnly = true)
    public Page<ChannelDto> getDirectMessageChannels(String userId, Pageable pageable) {
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        
        return channelRepository.findDirectMessageChannels(user, pageable)
            .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ChannelDto> searchChannels(String query, Pageable pageable) {
        return channelRepository.findByNameContainingIgnoreCase(query, pageable)
            .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ChannelDto> searchUserChannels(String userId, String search, Pageable pageable) {
        return channelRepository.findByMembershipsUserIdAndNameContainingIgnoreCase(userId, search, pageable)
            .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ChannelDto getChannel(UUID channelId, String userId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));
        
        // Check if user is a member
        if (!isMember(channel, userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        return toDto(channel);
    }

    private String generateDmChannelName(User user1, User user2) {
        return String.format("DM:%s:%s", user1.getUsername(), user2.getUsername());
    }

    @Transactional
    private void addMemberInternal(Channel channel, User user) {
        if (!membershipRepository.existsByChannelAndUser_UserId(channel, user.getUserId())) {
            log.debug("Adding member {} to channel {}", user.getUsername(), channel.getName());
            ChannelMembership membership = new ChannelMembership();
            membership.setChannel(channel);
            membership.setUser(user);
            membershipRepository.saveAndFlush(membership);
            log.debug("Successfully added member {} to channel {}", user.getUsername(), channel.getName());
        } else {
            log.debug("Member {} is already in channel {}", user.getUsername(), channel.getName());
        }
    }

    public boolean isMember(Channel channel, String userId) {
        return membershipRepository.existsByChannelAndUser_UserId(channel, userId);
    }

    private ChannelDto toDto(Channel channel) {
        ChannelDto dto = new ChannelDto();
        dto.setId(channel.getId());
        dto.setName(channel.getName());
        dto.setDirectMessage(channel.isDirectMessage());
        dto.setCreatedById(channel.getCreatedBy().getUserId());
        dto.setCreatedByUsername(channel.getCreatedBy().getUsername());
        dto.setCreatedAt(channel.getCreatedAt());
        dto.setMembers(channel.getMemberships().stream()
            .map(this::toMemberDto)
            .collect(Collectors.toSet()));
        dto.setMessageCount(channel.getMessages().size());
        dto.setFileCount(channel.getFiles().size());
        return dto;
    }

    private ChannelMemberDto toMemberDto(ChannelMembership membership) {
        ChannelMemberDto dto = new ChannelMemberDto();
        dto.setUserId(membership.getUser().getUserId());
        dto.setUsername(membership.getUser().getUsername());
        dto.setJoinedAt(membership.getJoinedAt());
        return dto;
    }
} 