package com.gauntletai.agustinbiondi.chatgenius.websocket;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventHandler {
    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastChannelCreated(ChannelDTO channel) {
        log.debug("Broadcasting channel created event for channel: {}", channel.getId());
        messagingTemplate.convertAndSend("/topic/channels/events", 
            new ChannelEvent("CREATED", channel));
    }

    public void broadcastChannelDeleted(ChannelDTO channel) {
        log.debug("Broadcasting channel deleted event for channel: {}", channel.getId());
        messagingTemplate.convertAndSend("/topic/channels/events", 
            new ChannelEvent("DELETED", channel));
    }

    public record ChannelEvent(String type, ChannelDTO channel) {}
} 