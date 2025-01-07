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
    public ResponseEntity<ReactionDto> addReaction(
        @PathVariable UUID messageId,
        @Valid @RequestBody CreateReactionRequest request,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        return ResponseEntity.ok(reactionService.addReaction(messageId, userId, request));
    }

    @DeleteMapping("/{reactionId}")
    public ResponseEntity<Void> removeReaction(
        @PathVariable UUID messageId,
        @PathVariable UUID reactionId,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        reactionService.removeReaction(messageId, reactionId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<ReactionDto>> getReactions(
        @PathVariable UUID messageId
    ) {
        return ResponseEntity.ok(reactionService.findByMessageId(messageId));
    }
} 