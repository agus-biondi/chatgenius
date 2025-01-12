package com.gauntletai.agustinbiondi.chatgenius.websocket;

import com.gauntletai.agustinbiondi.chatgenius.dto.ChannelDTO;
import com.gauntletai.agustinbiondi.chatgenius.dto.ReactionDTO;
import com.gauntletai.agustinbiondi.chatgenius.service.ReactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventHandler {
    private final SimpMessagingTemplate messagingTemplate;
    private final ReactionService reactionService;

    public void broadcastChannelCreated(ChannelDTO channel) {
        log.debug("Broadcasting channel created event for channel: {}", channel.getId());
        messagingTemplate.convertAndSend("/topic/channels/events", 
            new ChannelEvent("CREATED", channel));
        messagingTemplate.convertAndSend("/topic/channels", channel);
    }

    public void broadcastChannelDeleted(ChannelDTO channel) {
        log.debug("Broadcasting channel deleted event for channel: {}", channel.getId());
        messagingTemplate.convertAndSend("/topic/channels/events", 
            new ChannelEvent("DELETED", channel));
        messagingTemplate.convertAndSend("/topic/channels", channel);
    }

    public void broadcastChannelUpdated(ChannelDTO channel) {
        log.debug("Broadcasting channel updated event for channel: {}", channel.getId());
        messagingTemplate.convertAndSend("/topic/channels/events", 
            new ChannelEvent("UPDATED", channel));
        messagingTemplate.convertAndSend("/topic/channels", channel);
    }

    public void broadcastReactionUpdate(UUID messageId) {
        log.debug("Broadcasting reaction update for message: {}", messageId);
        List<ReactionDTO> reactions = reactionService.getReactionsForMessage(messageId);
        messagingTemplate.convertAndSend("/topic/reactions", 
            new ReactionUpdateEvent(messageId, reactions));
    }
}

@lombok.Value
class ChannelEvent {
    String type;
    ChannelDTO channel;
}

@lombok.Value
class ReactionUpdateEvent {
    UUID messageId;
    List<ReactionDTO> reactions;
} 