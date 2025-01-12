package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    /**
     * Fetch parent messages (messages without a parent) for a given channel.
     * Always sorted by createdAt desc.
     */
    @Query("SELECT m FROM Message m WHERE m.channel.id = :channelId AND m.parent IS NULL ORDER BY m.createdAt DESC")
    Page<Message> findParentMessagesByChannelId(@Param("channelId") UUID channelId, Pageable pageable);

    /**
     * Fetch the latest 3 replies for each parent message.
     * This method fetches replies where the parent ID is in the provided list of parent IDs.
     */
    List<Message> findTop3ByParentIdInOrderByCreatedAtDesc(List<UUID> parentIds);
} 