package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateMessageRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDto;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<Void> createMessage(
        @Valid @RequestBody CreateMessageRequest request,
        @AuthenticationPrincipal User user
    ) {
        messageService.createMessage(request.getChannelId(), user.getUserId(), request);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/channel/{channelId}")
    public ResponseEntity<Page<MessageDto>> getChannelMessages(
        @PathVariable UUID channelId,
        @AuthenticationPrincipal User user,
        Pageable pageable
    ) {
        Page<MessageDto> response = messageService.getChannelMessages(channelId, user.getUserId(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/thread/{parentMessageId}")
    public ResponseEntity<Page<MessageDto>> getThreadMessages(
        @PathVariable UUID parentMessageId,
        @AuthenticationPrincipal User user,
        Pageable pageable
    ) {
        Page<MessageDto> response = messageService.getThreadMessages(parentMessageId, user.getUserId(), pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<MessageDto> updateMessage(
        @PathVariable UUID messageId,
        @Valid @RequestBody CreateMessageRequest request,
        @AuthenticationPrincipal User user
    ) {
        MessageDto response = messageService.updateMessage(messageId, user.getUserId(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
        @PathVariable UUID messageId,
        @AuthenticationPrincipal User user
    ) {
        messageService.deleteMessage(messageId, user.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<MessageDto>> searchMessages(
        @RequestParam UUID channelId,
        @RequestParam String query,
        @AuthenticationPrincipal User user,
        Pageable pageable
    ) {
        Page<MessageDto> response = messageService.searchMessages(channelId, user.getUserId(), query, pageable);
        return ResponseEntity.ok(response);
    }
} 