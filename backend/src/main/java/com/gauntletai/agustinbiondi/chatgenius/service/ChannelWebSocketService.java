package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelWebSocketEventDto;
import com.gauntletai.agustinbiondi.chatgenius.util.ChannelEventBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ChannelWebSocketService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    private static final String CHANNEL_EVENTS_TOPIC = "/topic/channels";

    public void broadcastChannelCreated(ChannelDto channel, String userId) {
        System.out.println(String.format("[WebSocket] Broadcasting channel created event. channelId=%s, userId=%s, destination=%s", 
            channel.getId(), userId, CHANNEL_EVENTS_TOPIC));
        try {
            ChannelWebSocketEventDto event = ChannelEventBuilder.createChannelEvent(channel, userId);
            System.out.println(String.format("[WebSocket] Created channel event: type=%s, channelId=%s, userId=%s, timestamp=%s, payload=%s", 
                event.getType(), event.getChannelId(), event.getUserId(), event.getTimestamp(), event.getPayload()));
            
            System.out.println(String.format("[WebSocket] Attempting to send message to topic: %s", CHANNEL_EVENTS_TOPIC));
            messagingTemplate.convertAndSend(CHANNEL_EVENTS_TOPIC, event);
            System.out.println(String.format("[WebSocket] Successfully broadcasted channel created event to %s", CHANNEL_EVENTS_TOPIC));
        } catch (Exception e) {
            System.err.println("[WebSocket] Failed to broadcast channel created event");
            e.printStackTrace();
            throw e; // Re-throw to ensure transaction rollback
        }
    }

    public void broadcastChannelDeleted(UUID channelId, String userId) {
        System.out.println(String.format("[WebSocket] Broadcasting channel deleted event. channelId=%s, userId=%s, destination=%s", 
            channelId, userId, CHANNEL_EVENTS_TOPIC));
        try {
            ChannelWebSocketEventDto event = ChannelEventBuilder.deleteChannelEvent(channelId, userId);
            System.out.println(String.format("[WebSocket] Created channel event: type=%s, channelId=%s, userId=%s, timestamp=%s, payload=%s", 
                event.getType(), event.getChannelId(), event.getUserId(), event.getTimestamp(), event.getPayload()));
            
            System.out.println(String.format("[WebSocket] Attempting to send message to topic: %s", CHANNEL_EVENTS_TOPIC));
            messagingTemplate.convertAndSend(CHANNEL_EVENTS_TOPIC, event);
            System.out.println(String.format("[WebSocket] Successfully broadcasted channel deleted event to %s", CHANNEL_EVENTS_TOPIC));
        } catch (Exception e) {
            System.err.println("[WebSocket] Failed to broadcast channel deleted event");
            e.printStackTrace();
            throw e; // Re-throw to ensure transaction rollback
        }
    }

    // Future methods for other channel events
    /*
    public void broadcastChannelUpdated(ChannelDto channel, String userId) {
        log.debug("Broadcasting channel updated event for channel: {}", channel.getId());
        ChannelWebSocketEventDto event = ChannelEventBuilder.updateChannelEvent(channel, userId);
        messagingTemplate.convertAndSend(CHANNEL_EVENTS_TOPIC, event);
    }

    public void broadcastMemberAdded(UUID channelId, String userId, String memberId) {
        log.debug("Broadcasting member added event for channel: {}, member: {}", channelId, memberId);
        ChannelWebSocketEventDto event = ChannelEventBuilder.addMemberEvent(channelId, userId, memberId);
        messagingTemplate.convertAndSend(CHANNEL_EVENTS_TOPIC, event);
    }

    public void broadcastMemberRemoved(UUID channelId, String userId, String memberId) {
        log.debug("Broadcasting member removed event for channel: {}, member: {}", channelId, memberId);
        ChannelWebSocketEventDto event = ChannelEventBuilder.removeMemberEvent(channelId, userId, memberId);
        messagingTemplate.convertAndSend(CHANNEL_EVENTS_TOPIC, event);
    }
    */
} 