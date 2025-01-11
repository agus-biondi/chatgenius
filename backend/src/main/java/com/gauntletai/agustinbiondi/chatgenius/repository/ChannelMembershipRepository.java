package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.ChannelMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChannelMembershipRepository extends JpaRepository<ChannelMembership, UUID> {
    boolean existsByChannelAndUserUserId(Channel channel, String userId);
    
    boolean existsByChannelIdAndUserUserId(UUID channelId, String userId);
    
    void deleteByChannelIdAndUserUserId(UUID channelId, String userId);
    
    List<ChannelMembership> findByChannelId(UUID channelId);
} 