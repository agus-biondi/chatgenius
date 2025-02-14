package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.MessageDTO;
import com.gauntletai.agustinbiondi.chatgenius.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final MessageService messageService;

    @MessageMapping("/channels/{channelId}/messages")
    @SendTo("/topic/messages")
    public MessageDTO handleMessage(
            @DestinationVariable UUID channelId,
            MessageDTO messageDto,
            Principal principal
    ) {
        String userId = principal.getName();
        try {
            log.info("Received message from user {} in channel {}: {}", 
                    userId, channelId, messageDto.getContent());
            
            if (messageDto == null || messageDto.getContent() == null) {
                throw new IllegalArgumentException("Message content cannot be null");
            }

            MessageDTO processedMessage = messageService.handleIncomingMessage(messageDto, channelId, userId);
            
            log.info("Broadcasting message {} to global messages topic", 
                    processedMessage.getId());
            
            return processedMessage;
        } catch (IllegalArgumentException e) {
            log.warn("Invalid message received from user {} in channel {}: {}", 
                    userId, channelId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error processing message from user {} in channel {}: {}", 
                    userId, channelId, e.getMessage(), e);
            throw e;
        }
    }

    @MessageMapping("/channels/{channelId}/typing")
    @SendTo("/topic/presence")
    public String handleTypingEvent(
            @DestinationVariable UUID channelId,
            Principal principal
    ) {
        String userId = principal.getName();
        log.debug("User {} is typing in channel {}", 
                userId, channelId);
        
        return userId;
    }
} 