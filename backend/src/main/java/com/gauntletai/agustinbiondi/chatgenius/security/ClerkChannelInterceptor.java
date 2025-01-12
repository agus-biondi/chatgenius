package com.gauntletai.agustinbiondi.chatgenius.security;

import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClerkChannelInterceptor implements ChannelInterceptor {

    private final ClerkTokenValidator tokenValidator;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && (StompCommand.CONNECT.equals(accessor.getCommand()) 
                || StompCommand.SUBSCRIBE.equals(accessor.getCommand()))) {
            
            String token = accessor.getFirstNativeHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                try {
                    // Extract the token without "Bearer " prefix
                    String tokenValue = token.substring(7);
                    
                    // Verify token and get user ID
                    String clerkUserId = tokenValidator.verifyToken(tokenValue);
                    log.debug("WebSocket token verified for user: {}", clerkUserId);
                    
                    // Find user and set authentication
                    userRepository.findById(clerkUserId).ifPresent(user -> {
                        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
                        var authentication = new UsernamePasswordAuthenticationToken(
                            clerkUserId, // Use userId as principal name
                            null,
                            authorities
                        );
                        accessor.setUser(authentication);
                        log.debug("WebSocket authentication set for user: {}", clerkUserId);
                    });
                } catch (Exception e) {
                    log.error("WebSocket authentication failed", e);
                    return null; // Reject the message
                }
            } else {
                log.warn("No Authorization header found in WebSocket connection");
                return null; // Reject the message
            }
        }
        
        return message;
    }
} 