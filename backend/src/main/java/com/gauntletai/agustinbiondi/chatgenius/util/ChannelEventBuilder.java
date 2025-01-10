package com.gauntletai.agustinbiondi.chatgenius.util;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelEventType;
import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelWebSocketEventDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.Assert;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
public class ChannelEventBuilder {
    
    public static ChannelWebSocketEventDto createChannelEvent(ChannelDto channel, String userId) {
        // Validate input
        Assert.notNull(channel, "Channel cannot be null");
        Assert.notNull(channel.getId(), "Channel ID cannot be null");
        Assert.hasText(userId, "User ID cannot be empty");
        Assert.notNull(channel.getMembers(), "Channel members cannot be null");
        Assert.notNull(channel.getCreatedAt(), "Channel creation time cannot be null");

        // Log event creation
        log.debug("Creating channel event for channel: {}, creator: {}", channel.getId(), userId);

        // Create payload with complete channel data
        Map<String, Object> payload = new HashMap<>();
        payload.put("channel", channel);
        payload.put("timestamp", LocalDateTime.now());

        return ChannelWebSocketEventDto.builder()
            .type(ChannelEventType.CHANNEL_CREATE)
            .channelId(channel.getId())
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .payload(payload)
            .build();
    }

    public static ChannelWebSocketEventDto deleteChannelEvent(UUID channelId, String userId) {
        // Validate input
        Assert.notNull(channelId, "Channel ID cannot be null");
        Assert.hasText(userId, "User ID cannot be empty");

        // Log event creation
        log.debug("Creating channel deletion event for channel: {}, user: {}", channelId, userId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", LocalDateTime.now());

        return ChannelWebSocketEventDto.builder()
            .type(ChannelEventType.CHANNEL_DELETE)
            .channelId(channelId)
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .payload(payload)
            .build();
    }

    // Future event builders
    /*
    public static ChannelWebSocketEventDto updateChannelEvent(ChannelDto channel, String userId) {
        // Validate input
        Assert.notNull(channel, "Channel cannot be null");
        Assert.notNull(channel.getId(), "Channel ID cannot be null");
        Assert.hasText(userId, "User ID cannot be empty");

        // Log event creation
        log.debug("Creating channel update event for channel: {}, updater: {}", channel.getId(), userId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("channel", channel);
        payload.put("timestamp", LocalDateTime.now());

        return ChannelWebSocketEventDto.builder()
            .type(ChannelEventType.CHANNEL_UPDATE)
            .channelId(channel.getId())
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .payload(payload)
            .build();
    }

    public static ChannelWebSocketEventDto addMemberEvent(UUID channelId, String userId, String memberId) {
        // Validate input
        Assert.notNull(channelId, "Channel ID cannot be null");
        Assert.hasText(userId, "User ID cannot be empty");
        Assert.hasText(memberId, "Member ID cannot be empty");

        // Log event creation
        log.debug("Creating member add event for channel: {}, member: {}", channelId, memberId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("memberId", memberId);
        payload.put("timestamp", LocalDateTime.now());

        return ChannelWebSocketEventDto.builder()
            .type(ChannelEventType.CHANNEL_MEMBER_ADD)
            .channelId(channelId)
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .payload(payload)
            .build();
    }

    public static ChannelWebSocketEventDto removeMemberEvent(UUID channelId, String userId, String memberId) {
        // Validate input
        Assert.notNull(channelId, "Channel ID cannot be null");
        Assert.hasText(userId, "User ID cannot be empty");
        Assert.hasText(memberId, "Member ID cannot be empty");

        // Log event creation
        log.debug("Creating member remove event for channel: {}, member: {}", channelId, memberId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("memberId", memberId);
        payload.put("timestamp", LocalDateTime.now());

        return ChannelWebSocketEventDto.builder()
            .type(ChannelEventType.CHANNEL_MEMBER_REMOVE)
            .channelId(channelId)
            .userId(userId)
            .timestamp(LocalDateTime.now())
            .payload(payload)
            .build();
    }
    */
} 