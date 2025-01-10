package com.gauntletai.agustinbiondi.chatgenius.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${spring.webmvc.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker(
            "/topic/channel/",     // Channel-specific events (messages, reactions)
            "/topic/user/",        // User-specific notifications
            "/topic/channels"      // Global channel events (create, delete, update)
        );
        config.setApplicationDestinationPrefixes("/app");

        // TODO: Future considerations
        // 1. Consider setting heartbeat intervals for better connection management
        // 2. Consider setting message size limits
        // 3. Consider setting buffer sizes for performance
        // 4. Consider adding user destination prefix for direct messaging
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins(allowedOrigins.split(","));
    }
} 