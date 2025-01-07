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
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("POST /api/channels - Creating channel. userId=" + userId + ", request=" + request);
        ChannelDto response = channelService.createChannel(userId, request);
        System.out.println("POST /api/channels - Channel created. response=" + response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/dm/{otherUserId}")
    public ResponseEntity<ChannelDto> createOrGetDirectMessageChannel(
        @PathVariable String otherUserId,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("POST /api/channels/dm/" + otherUserId + " - Creating/getting DM channel. userId=" + userId);
        ChannelDto response = channelService.createOrGetDirectMessageChannel(userId, otherUserId);
        System.out.println("POST /api/channels/dm/" + otherUserId + " - DM channel created/retrieved. response=" + response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{channelId}")
    public ResponseEntity<ChannelDto> getChannel(
        @PathVariable UUID channelId,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("GET /api/channels/" + channelId + " - Getting channel. userId=" + userId);
        ChannelDto response = channelService.getChannel(channelId, userId);
        System.out.println("GET /api/channels/" + channelId + " - Channel retrieved. response=" + response);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<ChannelDto>> getUserChannels(
        @RequestHeader("X-User-ID") String userId,
        @RequestParam(required = false) String search,
        Pageable pageable
    ) {
        System.out.println("GET /api/channels - Getting user channels. userId=" + userId + ", search=" + search + ", pageable=" + pageable);
        Page<ChannelDto> response;
        if (search != null && !search.isEmpty()) {
            response = channelService.searchUserChannels(userId, search, pageable);
        } else {
            response = channelService.getUserChannels(userId, pageable);
        }
        System.out.println("GET /api/channels - Retrieved " + response.getContent().size() + " channels");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{channelId}/members/{memberId}")
    public ResponseEntity<Void> addMember(
        @PathVariable UUID channelId,
        @PathVariable String memberId,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("POST /api/channels/" + channelId + "/members/" + memberId + " - Adding member. userId=" + userId);
        channelService.addMember(channelId, userId, memberId);
        System.out.println("POST /api/channels/" + channelId + "/members/" + memberId + " - Member added");
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{channelId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
        @PathVariable UUID channelId,
        @PathVariable String memberId,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("DELETE /api/channels/" + channelId + "/members/" + memberId + " - Removing member. userId=" + userId);
        channelService.removeMember(channelId, userId, memberId);
        System.out.println("DELETE /api/channels/" + channelId + "/members/" + memberId + " - Member removed");
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
        @PathVariable UUID channelId,
        @RequestHeader("X-User-ID") String userId
    ) {
        System.out.println("DELETE /api/channels/" + channelId + " - Deleting channel. userId=" + userId);
        channelService.deleteChannel(channelId, userId);
        System.out.println("DELETE /api/channels/" + channelId + " - Channel deleted");
        return ResponseEntity.noContent().build();
    }
} 