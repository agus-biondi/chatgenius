package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, UUID> {
    List<Channel> findByCreatedBy(User user);
    
    @Query("SELECT c FROM Channel c JOIN c.members m WHERE m = :user")
    Page<Channel> findChannelsByMember(User user, Pageable pageable);
    
    @Query("SELECT c FROM Channel c WHERE c.isDirectMessage = true AND :user MEMBER OF c.members")
    List<Channel> findDirectMessageChannels(User user);
    
    List<Channel> findByNameContainingIgnoreCase(String name);
    
    boolean existsByNameAndIsDirectMessageFalse(String name);
} 