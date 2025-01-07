package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateReactionRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDto;
import com.gauntletai.agustinbiondi.chatgenius.service.ReactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages/{messageId}/reactions")
@RequiredArgsConstructor
public class ReactionController {
    private final ReactionService reactionService;

    @PostMapping
    public ResponseEntity<Void> addReaction(
        @PathVariable UUID messageId,
        @Valid @RequestBody CreateReactionRequest request,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("POST /api/messages/" + messageId + "/reactions - Adding reaction. userId=" + userId + ", request=" + request);
        reactionService.addReaction(messageId, userId, request);
        System.out.println("POST /api/messages/" + messageId + "/reactions - Reaction creation initiated");
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/{reactionId}")
    public ResponseEntity<Void> removeReaction(
        @PathVariable UUID messageId,
        @PathVariable UUID reactionId,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("DELETE /api/messages/" + messageId + "/reactions/" + reactionId + " - Removing reaction. userId=" + userId);
        reactionService.removeReaction(messageId, reactionId, userId);
        System.out.println("DELETE /api/messages/" + messageId + "/reactions/" + reactionId + " - Reaction removed");
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ReactionDto>> getMessageReactions(
        @PathVariable UUID messageId,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("GET /api/messages/" + messageId + "/reactions - Getting reactions. userId=" + userId);
        List<ReactionDto> response = reactionService.findByMessageId(messageId);
        System.out.println("GET /api/messages/" + messageId + "/reactions - Retrieved " + response.size() + " reactions");
        return ResponseEntity.ok(response);
    }
} 