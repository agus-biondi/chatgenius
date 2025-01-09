package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.CreateChannelRequest;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
        @AuthenticationPrincipal User user
    ) {
        System.out.println("POST /api/channels - Creating channel. userId=" + user.getUserId() + ", request=" + request);
        ChannelDto response = channelService.createChannel(user.getUserId(), request);
        System.out.println("POST /api/channels - Channel created. response=" + response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/dm/{otherUserId}")
    public ResponseEntity<ChannelDto> createOrGetDirectMessageChannel(
        @PathVariable String otherUserId,
        @AuthenticationPrincipal User user
    ) {
        System.out.println("POST /api/channels/dm/" + otherUserId + " - Creating/getting DM channel. userId=" + user.getUserId());
        ChannelDto response = channelService.createOrGetDirectMessageChannel(user.getUserId(), otherUserId);
        System.out.println("POST /api/channels/dm/" + otherUserId + " - DM channel created/retrieved. response=" + response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{channelId}")
    public ResponseEntity<ChannelDto> getChannel(
        @PathVariable UUID channelId,
        @AuthenticationPrincipal User user
    ) {
        System.out.println("GET /api/channels/" + channelId + " - Getting channel. userId=" + user.getUserId());
        ChannelDto response = channelService.getChannel(channelId, user.getUserId());
        System.out.println("GET /api/channels/" + channelId + " - Channel retrieved. response=" + response);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<ChannelDto>> getUserChannels(
        @AuthenticationPrincipal User user,
        @RequestParam(required = false) String search,
        Pageable pageable
    ) {
        System.out.println("GET /api/channels - Request received");
        System.out.println("Authentication principal: " + (user != null ? user.toString() : "null"));
        System.out.println("Search param: " + search);
        System.out.println("Pageable: " + pageable);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Page<ChannelDto> response;
            if (search != null && !search.isEmpty()) {
                response = channelService.searchUserChannels(user.getUserId(), search, pageable);
            } else {
                response = channelService.getUserChannels(user.getUserId(), pageable);
            }
            System.out.println("GET /api/channels - Retrieved " + response.getContent().size() + " channels");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in getUserChannels: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/{channelId}/members/{memberId}")
    public ResponseEntity<Void> addMember(
        @PathVariable UUID channelId,
        @PathVariable String memberId,
        @AuthenticationPrincipal User user
    ) {
        System.out.println("POST /api/channels/" + channelId + "/members/" + memberId + " - Adding member. userId=" + user.getUserId());
        channelService.addMember(channelId, user.getUserId(), memberId);
        System.out.println("POST /api/channels/" + channelId + "/members/" + memberId + " - Member added");
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{channelId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
        @PathVariable UUID channelId,
        @PathVariable String memberId,
        @AuthenticationPrincipal User user
    ) {
        System.out.println("DELETE /api/channels/" + channelId + "/members/" + memberId + " - Removing member. userId=" + user.getUserId());
        channelService.removeMember(channelId, user.getUserId(), memberId);
        System.out.println("DELETE /api/channels/" + channelId + "/members/" + memberId + " - Member removed");
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(
        @PathVariable UUID channelId,
        @AuthenticationPrincipal User user
    ) {
        System.out.println("DELETE /api/channels/" + channelId + " - Deleting channel. userId=" + user.getUserId());
        channelService.deleteChannel(channelId, user.getUserId());
        System.out.println("DELETE /api/channels/" + channelId + " - Channel deleted");
        return ResponseEntity.noContent().build();
    }
} 