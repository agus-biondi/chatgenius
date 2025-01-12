package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDTO;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.service.ReactionService;
import com.gauntletai.agustinbiondi.chatgenius.websocket.WebSocketEventHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/messages")
public class ReactionController {

    private final ReactionService reactionService;
    private final WebSocketEventHandler webSocketEventHandler;

    /**
     * Add a reaction to a message.
     * If the user has already reacted with this emoji, the existing reaction is deleted and a new one is created.
     */
    @PostMapping("/{messageId}/reactions")
    public ResponseEntity<ReactionDTO> addReaction(
            @PathVariable @NotNull UUID messageId,
            @RequestParam @NotBlank String emoji) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        log.debug("REST request to add reaction {} to message {} by user {}", emoji, messageId, userId);
        
        ReactionDTO reaction = reactionService.addReaction(userId, messageId, emoji);
        
        // Broadcast the reaction update to all subscribers
        webSocketEventHandler.broadcastReactionUpdate(messageId);
        
        return ResponseEntity.ok(reaction);
    }

    /**
     * Remove a reaction from a message.
     */
    @DeleteMapping("/{messageId}/reactions/{emoji}")
    public ResponseEntity<Void> removeReaction(
            @PathVariable @NotNull UUID messageId,
            @PathVariable @NotBlank String emoji) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.debug("REST request to remove reaction {} from message {} by user {}", emoji, messageId, user.getUserId());
        
        reactionService.removeReaction(user.getUserId(), messageId, emoji);
        
        // Broadcast the reaction update to all subscribers
        webSocketEventHandler.broadcastReactionUpdate(messageId);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all reactions for a message.
     */
    @GetMapping("/{messageId}/reactions")
    public ResponseEntity<List<ReactionDTO>> getReactions(
            @PathVariable @NotNull UUID messageId) {
        log.debug("REST request to get all reactions for message {}", messageId);
        
        return ResponseEntity.ok(reactionService.getReactionsForMessage(messageId));
    }

    /**
     * Get the count of a specific emoji reaction on a message.
     */
    @GetMapping("/{messageId}/reactions/{emoji}/count")
    public ResponseEntity<Long> getReactionCount(
            @PathVariable @NotNull UUID messageId,
            @PathVariable @NotBlank String emoji) {
        log.debug("REST request to get count for reaction {} on message {}", emoji, messageId);
        
        return ResponseEntity.ok(reactionService.getReactionCount(messageId, emoji));
    }

    /**
     * Get reactions for multiple messages.
     */
    @PostMapping("/reactions/batch")
    public ResponseEntity<Map<UUID, List<ReactionDTO>>> getReactionsForMessages(
            @RequestBody @Valid BatchReactionsRequest request) {
        log.debug("REST request to get reactions for messages: {}", request.messageIds());
        
        return ResponseEntity.ok(reactionService.getReactionsForMessages(request.messageIds()));
    }

    public record BatchReactionsRequest(@NotNull List<UUID> messageIds) {}
} 