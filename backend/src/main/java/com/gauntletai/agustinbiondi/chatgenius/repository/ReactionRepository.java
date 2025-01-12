package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, UUID> {
    
    /**
     * Find a reaction by user ID, message ID, and emoji.
     * Used to check if a user has already reacted with a specific emoji to a message.
     */
    Optional<Reaction> findByUserUserIdAndMessageIdAndEmoji(String userId, UUID messageId, String emoji);
    
    /**
     * Find all reactions for a specific message.
     * Used to display all reactions on a message.
     */
    List<Reaction> findAllByMessageId(UUID messageId);
    
    /**
     * Find all reactions for a list of message IDs.
     * Used to efficiently fetch reactions for multiple messages in one query.
     */
    List<Reaction> findAllByMessageIdIn(List<UUID> messageIds);
    
    /**
     * Delete a reaction by user ID, message ID, and emoji.
     * Used when a user removes their reaction.
     */
    void deleteByUserUserIdAndMessageIdAndEmoji(String userId, UUID messageId, String emoji);
    
    /**
     * Count reactions by message ID and emoji.
     * Used to display reaction counts.
     */
    @Query("SELECT COUNT(r) FROM Reaction r WHERE r.message.id = :messageId AND r.emoji = :emoji")
    long countByMessageIdAndEmoji(@Param("messageId") UUID messageId, @Param("emoji") String emoji);
} 