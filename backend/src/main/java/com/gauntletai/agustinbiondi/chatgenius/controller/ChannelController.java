package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDTO;
import com.gauntletai.agustinbiondi.chatgenius.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @PostMapping
    public ResponseEntity<ChannelDTO> createChannel(
            @Valid @RequestBody ChannelDTO channelDTO,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(channelService.createChannel(channelDTO, userId));
    }

    @PutMapping("/{channelId}")
    public ResponseEntity<ChannelDTO> updateChannel(
            @PathVariable UUID channelId,
            @Valid @RequestBody ChannelDTO channelDTO,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(channelService.updateChannel(channelId, channelDTO, userId));
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable UUID channelId,
            @AuthenticationPrincipal String userId) {
        channelService.deleteChannel(channelId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{channelId}")
    public ResponseEntity<ChannelDTO> getChannel(@PathVariable UUID channelId) {
        return channelService.findById(channelId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/public")
    public ResponseEntity<List<ChannelDTO>> getPublicChannels() {
        return ResponseEntity.ok(channelService.findAllPublicChannels());
    }

    @GetMapping("/user")
    public ResponseEntity<List<ChannelDTO>> getUserChannels(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(channelService.findUserChannels(userId));
    }

    @PostMapping("/{channelId}/members")
    public ResponseEntity<Void> joinChannel(
            @PathVariable UUID channelId,
            @AuthenticationPrincipal String userId) {
        channelService.addMember(channelId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{channelId}/members")
    public ResponseEntity<Void> leaveChannel(
            @PathVariable UUID channelId,
            @AuthenticationPrincipal String userId) {
        channelService.removeMember(channelId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{channelId}/members")
    public ResponseEntity<Set<String>> getChannelMembers(
            @PathVariable UUID channelId) {
        return ResponseEntity.ok(channelService.getChannelMembers(channelId));
    }

    @GetMapping("/{channelId}/members/{userId}")
    public ResponseEntity<Boolean> isUserMember(
            @PathVariable UUID channelId,
            @PathVariable String userId) {
        return ResponseEntity.ok(channelService.isUserMember(channelId, userId));
    }

    @PostMapping("/dm/{otherUserId}")
    public ResponseEntity<ChannelDTO> createOrGetDirectMessageChannel(
            @PathVariable String otherUserId,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(channelService.createDirectMessageChannel(userId, otherUserId));
    }

    @GetMapping("/available")
    public ResponseEntity<List<ChannelDTO>> getAvailableChannels(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(channelService.findPublicAndUserDirectMessageChannels(userId));
    }
} 