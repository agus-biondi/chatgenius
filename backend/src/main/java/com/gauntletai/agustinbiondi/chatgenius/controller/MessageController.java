package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDTO;
import com.gauntletai.agustinbiondi.chatgenius.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import com.gauntletai.agustinbiondi.chatgenius.model.User;

@Slf4j
@RestController
@RequestMapping("/api/channels/{channelId}/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @GetMapping("/parents")
    public ResponseEntity<Page<MessageDTO>> getLatestParentMessages(
            @PathVariable UUID channelId) {
        return ResponseEntity.ok(messageService.getLatestParentMessages(channelId));
    }

} 