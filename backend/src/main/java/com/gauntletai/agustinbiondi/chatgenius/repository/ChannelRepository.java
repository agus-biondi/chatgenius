package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, UUID> {
    List<Channel> findByType(Channel.Type type);
    
    List<Channel> findByMembershipsUserUserId(String userId);
    
    @Query("SELECT c FROM Channel c " +
           "WHERE c.type = 'DIRECT_MESSAGE' " +
           "AND EXISTS (SELECT m1 FROM ChannelMembership m1 WHERE m1.channel = c AND m1.user.userId = :userId1) " +
           "AND EXISTS (SELECT m2 FROM ChannelMembership m2 WHERE m2.channel = c AND m2.user.userId = :userId2)")
    Optional<Channel> findDirectMessageChannelBetweenUsers(
            @Param("userId1") String userId1,
            @Param("userId2") String userId2);

    @Query("SELECT c FROM Channel c " +
           "WHERE c.type = 'PUBLIC' " +
           "OR (c.type = 'DIRECT_MESSAGE' AND EXISTS " +
           "(SELECT m FROM ChannelMembership m WHERE m.channel = c AND m.user.userId = :userId))")
    List<Channel> findPublicAndUserDirectMessageChannels(@Param("userId") String userId);

    @Query("SELECT COUNT(cm) > 0 FROM ChannelMembership cm WHERE cm.channel.id = :channelId AND cm.user.userId = :userId")
    boolean isUserMember(UUID channelId, String userId);
} 