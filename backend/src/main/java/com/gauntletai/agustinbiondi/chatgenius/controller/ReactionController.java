package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateReactionRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDto;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.service.ReactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
        @AuthenticationPrincipal User user
    ) {
        reactionService.addReaction(messageId, user.getUserId(), request);
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/{reactionId}")
    public ResponseEntity<Void> removeReaction(
        @PathVariable UUID messageId,
        @PathVariable UUID reactionId,
        @AuthenticationPrincipal User user
    ) {
        reactionService.removeReaction(messageId, reactionId, user.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ReactionDto>> getMessageReactions(
        @PathVariable UUID messageId,
        @AuthenticationPrincipal User user
    ) {
        List<ReactionDto> response = reactionService.findByMessageId(messageId);
        return ResponseEntity.ok(response);
    }
} 