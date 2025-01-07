package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.ChannelMembership;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChannelMembershipRepository extends JpaRepository<ChannelMembership, UUID> {
    List<ChannelMembership> findByChannel(Channel channel);
    List<ChannelMembership> findByUser(User user);
    boolean existsByChannelAndUser_UserId(Channel channel, String userId);
    Optional<ChannelMembership> findByChannelAndUser_UserId(Channel channel, String userId);
} 