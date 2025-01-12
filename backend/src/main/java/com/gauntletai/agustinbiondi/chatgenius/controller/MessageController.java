package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDTO;
import com.gauntletai.agustinbiondi.chatgenius.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/channels/{channelId}/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @GetMapping("/parents")
    public ResponseEntity<List<MessageDTO>> getLatestParentMessages(@PathVariable UUID channelId) {
        log.debug("REST request to get latest parent messages for channel: {}", channelId);
        return ResponseEntity.ok(messageService.getLatestParentMessages(channelId));
    }

    // ... existing endpoints ...
} 