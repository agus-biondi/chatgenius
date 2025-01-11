package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Set;

public interface ChannelService {
    ChannelDTO createChannel(ChannelDTO channelDTO, String userId);
    ChannelDTO updateChannel(UUID channelId, ChannelDTO channelDTO, String userId);
    void deleteChannel(UUID channelId, String userId);
    Optional<ChannelDTO> findById(UUID channelId);
    List<ChannelDTO> findAllPublicChannels();
    List<ChannelDTO> findUserChannels(String userId);
    void addMember(UUID channelId, String userId);
    void removeMember(UUID channelId, String userId);
    Set<String> getChannelMembers(UUID channelId);
    boolean isUserMember(UUID channelId, String userId);
    ChannelDTO createDirectMessageChannel(String userId1, String userId2);
    List<ChannelDTO> findPublicAndUserDirectMessageChannels(String userId);
} 