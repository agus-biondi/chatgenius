package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    Page<Message> findByChannelOrderByCreatedAtDesc(Channel channel, Pageable pageable);
    
    Page<Message> findByParentMessageOrderByCreatedAtAsc(Message parentMessage, Pageable pageable);
    
    @Query("SELECT m FROM Message m WHERE m.channel = :channel AND m.content LIKE %:query%")
    Page<Message> searchMessages(Channel channel, String query, Pageable pageable);
    
    List<Message> findByCreatedBy(User user);
    
    void deleteByChannel(Channel channel);

    @Query(value = """
            SELECT DISTINCT ON (m.id) m.*, 
                   array_agg(r.emoji) FILTER (WHERE r.id IS NOT NULL) as reactions,
                   array_agg(ru.username) FILTER (WHERE r.id IS NOT NULL) as reaction_usernames,
                   array_agg(r.user_id) FILTER (WHERE r.id IS NOT NULL) as reaction_user_ids,
                   array_agg(r.created_at) FILTER (WHERE r.id IS NOT NULL) as reaction_created_ats
            FROM messages m
            LEFT JOIN reactions r ON r.message_id = m.id
            LEFT JOIN users ru ON r.user_id = ru.id
            WHERE m.channel_id = :channelId
            GROUP BY m.id, m.content, m.created_by, m.channel_id, m.parent_message_id, m.created_at
            ORDER BY m.id, m.created_at DESC
            LIMIT :limit OFFSET :offset
            """, 
            nativeQuery = true)
    List<Message> findMessagesWithReactions(UUID channelId, int limit, int offset);

    // Count query for pagination
    @Query(value = "SELECT COUNT(DISTINCT m.id) FROM messages m WHERE m.channel_id = :channelId", 
           nativeQuery = true)
    long countMessagesByChannel(UUID channelId);
} 