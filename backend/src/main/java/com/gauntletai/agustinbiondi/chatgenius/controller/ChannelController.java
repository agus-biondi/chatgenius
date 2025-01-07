package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.CreateChannelRequest;
import com.gauntletai.agustinbiondi.chatgenius.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {
    private final ChannelService channelService;

    @PostMapping
    public ResponseEntity<ChannelDto> createChannel(
        @Valid @RequestBody CreateChannelRequest request,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(channelService.createChannel(userId, request));
    }

    @PostMapping("/dm/{otherUserId}")
    public ResponseEntity<ChannelDto> createOrGetDirectMessageChannel(
        @PathVariable UUID otherUserId,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        return ResponseEntity.ok(channelService.createOrGetDirectMessageChannel(userId, otherUserId));
    }

    @GetMapping("/{channelId}")
    public ResponseEntity<ChannelDto> getChannel(
        @PathVariable UUID channelId,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        return ResponseEntity.ok(channelService.getChannel(channelId, userId));
    }

    @GetMapping
    public ResponseEntity<Page<ChannelDto>> getUserChannels(
        @RequestHeader("X-User-ID") UUID userId,
        @RequestParam(required = false) String search,
        Pageable pageable
    ) {
        if (search != null && !search.isEmpty()) {
            return ResponseEntity.ok(channelService.searchUserChannels(userId, search, pageable));
        }
        return ResponseEntity.ok(channelService.getUserChannels(userId, pageable));
    }

    @PostMapping("/{channelId}/members/{memberId}")
    public ResponseEntity<Void> addMember(
        @PathVariable UUID channelId,
        @PathVariable UUID memberId,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        channelService.addMember(channelId, memberId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{channelId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
        @PathVariable UUID channelId,
        @PathVariable UUID memberId,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        channelService.removeMember(channelId, memberId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
        @PathVariable UUID channelId,
        @RequestHeader("X-User-ID") UUID userId
    ) {
        channelService.deleteChannel(channelId, userId);
        return ResponseEntity.noContent().build();
    }
} 