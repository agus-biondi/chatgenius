package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDTO;

import java.util.List;
import java.util.UUID;
import java.util.Map;

public interface ReactionService {
    /**
     * Add or update a reaction to a message.
     * If the user has already reacted with this emoji, the existing reaction is deleted and a new one is created.
     *
     * @param userId    The ID of the user adding the reaction
     * @param messageId The ID of the message being reacted to
     * @param emoji     The emoji to react with
     * @return The created or updated reaction
     */
    ReactionDTO addReaction(String userId, UUID messageId, String emoji);

    /**
     * Remove a reaction from a message.
     *
     * @param userId    The ID of the user removing their reaction
     * @param messageId The ID of the message the reaction is on
     * @param emoji     The emoji to remove
     */
    void removeReaction(String userId, UUID messageId, String emoji);

    /**
     * Get all reactions for a message.
     *
     * @param messageId The ID of the message to get reactions for
     * @return List of reactions on the message
     */
    List<ReactionDTO> getReactionsForMessage(UUID messageId);

    /**
     * Get all reactions for multiple messages.
     *
     * @param messageIds The list of message IDs to get reactions for
     * @return Map of message ID to list of reactions on that message
     */
    Map<UUID, List<ReactionDTO>> getReactionsForMessages(List<UUID> messageIds);

    /**
     * Get the count of a specific emoji reaction on a message.
     *
     * @param messageId The ID of the message to count reactions for
     * @param emoji     The emoji to count
     * @return The number of times this emoji has been used to react to this message
     */
    long getReactionCount(UUID messageId, String emoji);
} 