package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelMemberDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.CreateChannelRequest;
import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.ChannelMembership;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelMembershipRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChannelService {
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final ChannelMembershipRepository membershipRepository;

    public ChannelDto createChannel(UUID creatorId, CreateChannelRequest request) {
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        //TODO not on DMs?
        if (!request.isDirectMessage() && channelRepository.existsByNameAndIsDirectMessageFalse(request.getName())) {
            throw new IllegalArgumentException("Channel name already exists");
        }

        Channel channel = new Channel();
        channel.setName(request.getName());
        channel.setDirectMessage(request.isDirectMessage());
        channel.setCreatedBy(creator);
        
        Channel savedChannel = channelRepository.save(channel);

        // Add creator as first member
        addMemberInternal(savedChannel, creator);

        // Add other members
        request.getMemberIds().stream()
            .filter(id -> !id.equals(creatorId))
            .forEach(memberId -> {
                User member = userRepository.findById(memberId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + memberId));
                addMemberInternal(savedChannel, member);
            });

        return toDto(savedChannel);
    }

    @Transactional(readOnly = true)
    public ChannelDto getChannel(UUID channelId, UUID userId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));
        
        // Check if user is a member
        if (!isMember(channel, userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        return toDto(channel);
    }

    @Transactional(readOnly = true)
    public Page<ChannelDto> getUserChannels(UUID userId, Pageable pageable) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        
        return channelRepository.findChannelsByMember(user, pageable)
            .map(this::toDto);
    }

    public void deleteChannel(UUID channelId, UUID userId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Only creator or admin can delete channel
        if (!channel.getCreatedBy().getId().equals(userId) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only channel creator or admin can delete the channel");
        }

        channelRepository.delete(channel);
    }

    public void addMember(UUID channelId, UUID userId, UUID memberToAddId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));
        
        // Check if requester is a member
        if (!isMember(channel, userId)) {
            throw new AccessDeniedException("Only channel members can add new members");
        }

        User memberToAdd = userRepository.findById(memberToAddId)
            .orElseThrow(() -> new EntityNotFoundException("User to add not found"));

        addMemberInternal(channel, memberToAdd);
    }

    public void removeMember(UUID channelId, UUID userId, UUID memberToRemoveId) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));
        
        // Only creator or self-removal is allowed
        if (!channel.getCreatedBy().getId().equals(userId) && !userId.equals(memberToRemoveId)) {
            throw new AccessDeniedException("Only channel creator can remove members");
        }

        membershipRepository.findByChannelAndUser_Id(channel, memberToRemoveId)
            .ifPresent(membershipRepository::delete);
    }

    public ChannelDto createOrGetDirectMessageChannel(UUID creatorId, UUID otherUserId) {
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new EntityNotFoundException("Creator not found"));
        User other = userRepository.findById(otherUserId)
            .orElseThrow(() -> new EntityNotFoundException("Other user not found"));

        // Check if DM channel already exists
        UUID finalOtherUserId = otherUserId;
        return channelRepository.findAllDirectMessageChannels(creator).stream()
            .filter(ch -> ch.getMemberships().stream()
                .anyMatch(membership -> membership.getUser().getId().equals(finalOtherUserId)))
            .findFirst()
            .map(this::toDto)
            .orElseGet(() -> {
                CreateChannelRequest request = new CreateChannelRequest();
                request.setDirectMessage(true);
                request.setName("DM:" + creator.getUsername() + ":" + other.getUsername());
                request.setMemberIds(Set.of(otherUserId));
                return createChannel(creatorId, request);
            });
    }

    @Transactional(readOnly = true)
    public Page<ChannelDto> getDirectMessageChannels(UUID userId, Pageable pageable) {
        User user = userRepository.findById(userId)
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
    public Page<ChannelDto> searchUserChannels(UUID userId, String search, Pageable pageable) {
        return channelRepository.findByMembershipsUserIdAndNameContainingIgnoreCase(userId, search, pageable)
            .map(this::toDto);
    }

    private void addMemberInternal(Channel channel, User member) {
        if (membershipRepository.existsByChannelAndUser(channel, member)) {
            return; // Already a member
        }

        ChannelMembership membership = new ChannelMembership();
        membership.setChannel(channel);
        membership.setUser(member);
        membershipRepository.save(membership);
    }

    public boolean isMember(Channel channel, UUID userId) {
        return membershipRepository.existsByChannelAndUser_Id(channel, userId);
    }

    private ChannelDto toDto(Channel channel) {
        ChannelDto dto = new ChannelDto();
        dto.setId(channel.getId());
        dto.setName(channel.getName());
        dto.setDirectMessage(channel.isDirectMessage());
        dto.setCreatedById(channel.getCreatedBy().getId());
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
        dto.setUserId(membership.getUser().getId());
        dto.setUsername(membership.getUser().getUsername());
        dto.setJoinedAt(membership.getJoinedAt());
        return dto;
    }
} 