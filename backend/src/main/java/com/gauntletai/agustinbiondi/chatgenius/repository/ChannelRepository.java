package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, UUID> {
    List<Channel> findByCreatedBy(User user);
    
    @Query("SELECT c FROM Channel c JOIN c.memberships m WHERE m.user = :user")
    Page<Channel> findChannelsByMember(@Param("user") User user, Pageable pageable);
    
    @Query("SELECT c FROM Channel c JOIN c.memberships m WHERE c.isDirectMessage = true AND m.user = :user")
    Page<Channel> findDirectMessageChannels(@Param("user") User user, Pageable pageable);
    
    @Query("SELECT c FROM Channel c JOIN c.memberships m WHERE c.isDirectMessage = true AND m.user = :user")
    List<Channel> findAllDirectMessageChannels(@Param("user") User user);
    
    Page<Channel> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    boolean existsByNameAndIsDirectMessageFalse(String name);
    
    Page<Channel> findByMembershipsUserIdAndNameContainingIgnoreCase(UUID userId, String name, Pageable pageable);
} 