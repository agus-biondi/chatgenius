package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateMessageRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDto;
import com.gauntletai.agustinbiondi.chatgenius.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
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
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("POST /api/messages - Creating message. userId=" + userId + ", request=" + request);
        messageService.createMessage(request.getChannelId(), userId, request);
        System.out.println("POST /api/messages - Message creation initiated");
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/channel/{channelId}")
    public ResponseEntity<Page<MessageDto>> getChannelMessages(
        @PathVariable UUID channelId,
        @RequestHeader("X-User-ID") String userId,
        Pageable pageable
    ) {
        System.out.println("GET /api/messages/channel/" + channelId + " - Getting messages. userId=" + userId + ", pageable=" + pageable);
        Page<MessageDto> response = messageService.getChannelMessages(channelId, userId, pageable);
        System.out.println("GET /api/messages/channel/" + channelId + " - Retrieved " + response.getContent().size() + " messages");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/thread/{parentMessageId}")
    public ResponseEntity<Page<MessageDto>> getThreadMessages(
        @PathVariable UUID parentMessageId,
        @RequestHeader("X-User-ID") String userId,
        Pageable pageable
    ) {
        System.out.println("GET /api/messages/thread/" + parentMessageId + " - Getting thread messages. userId=" + userId + ", pageable=" + pageable);
        Page<MessageDto> response = messageService.getThreadMessages(parentMessageId, userId, pageable);
        System.out.println("GET /api/messages/thread/" + parentMessageId + " - Retrieved " + response.getContent().size() + " messages");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<MessageDto> updateMessage(
        @PathVariable UUID messageId,
        @Valid @RequestBody CreateMessageRequest request,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("PUT /api/messages/" + messageId + " - Updating message. userId=" + userId + ", request=" + request);
        MessageDto response = messageService.updateMessage(messageId, userId, request);
        System.out.println("PUT /api/messages/" + messageId + " - Message updated. response=" + response);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
        @PathVariable UUID messageId,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("DELETE /api/messages/" + messageId + " - Deleting message. userId=" + userId);
        messageService.deleteMessage(messageId, userId);
        System.out.println("DELETE /api/messages/" + messageId + " - Message deleted");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<MessageDto>> searchMessages(
        @RequestParam UUID channelId,
        @RequestParam String query,
        @RequestHeader("X-User-ID") String userId,
        Pageable pageable
    ) {
        System.out.println("GET /api/messages/search - Searching messages. userId=" + userId + ", channelId=" + channelId + ", query=" + query + ", pageable=" + pageable);
        Page<MessageDto> response = messageService.searchMessages(channelId, userId, query, pageable);
        System.out.println("GET /api/messages/search - Found " + response.getContent().size() + " messages");
        return ResponseEntity.ok(response);
    }
} 