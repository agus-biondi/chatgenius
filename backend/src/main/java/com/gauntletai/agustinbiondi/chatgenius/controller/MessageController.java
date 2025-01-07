package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateMessageRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDto;
import com.gauntletai.agustinbiondi.chatgenius.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageDto> createMessage(
        @Valid @RequestBody CreateMessageRequest request,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(messageService.createMessage(request.getChannelId(), userId, request));
    }

    @GetMapping("/channel/{channelId}")
    public ResponseEntity<Page<MessageDto>> getChannelMessages(
        @PathVariable UUID channelId,
        @RequestHeader("X-User-ID") UUID userId,
        Pageable pageable
    ) {
        return ResponseEntity.ok(messageService.getChannelMessages(channelId, userId, pageable));
    }

    @GetMapping("/thread/{parentMessageId}")
    public ResponseEntity<Page<MessageDto>> getThreadMessages(
        @PathVariable UUID parentMessageId,
        @RequestHeader("X-User-ID") UUID userId,
        Pageable pageable
    ) {
        return ResponseEntity.ok(messageService.getThreadMessages(parentMessageId, userId, pageable));
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<MessageDto> updateMessage(
        @PathVariable UUID messageId,
        @Valid @RequestBody CreateMessageRequest request,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        return ResponseEntity.ok(messageService.updateMessage(messageId, userId, request));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
        @PathVariable UUID messageId,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        messageService.deleteMessage(messageId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<MessageDto>> searchMessages(
        @RequestParam UUID channelId,
        @RequestParam String query,
        @RequestHeader("X-User-ID") UUID userId,
        Pageable pageable
    ) {
        return ResponseEntity.ok(messageService.searchMessages(channelId, userId, query, pageable));
    }
} 