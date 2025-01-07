package com.gauntletai.agustinbiondi.chatgenius.security;

import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ClerkAuthFilter extends OncePerRequestFilter {
    private final UserRepository userRepository;
    
    @Value("${clerk.public-key}")
    private String clerkPublicKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = request.getHeader("Authorization");
        
        if (token != null && token.startsWith("Bearer ")) {
            String sessionToken = token.substring(7);
            try {
                // TODO: Use clerk-sdk-java to verify the token
                // For now, we'll validate the token format and look up the user
                String clerkUserId = verifyAndGetClerkUserId(sessionToken);
                if (clerkUserId != null) {
                    User user = userRepository.findByUserId(clerkUserId)
                        .orElseGet(() -> createNewUser(clerkUserId));
                    
                    List<SimpleGrantedAuthority> authorities = 
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                    
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(user, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
            }
        }
        
        filterChain.doFilter(request, response);
    }

    private String verifyAndGetClerkUserId(String token) {
        // TODO: Implement token verification using clerk-sdk-java
        // For now, return null to indicate invalid token
        return null;
    }

    private User createNewUser(String clerkUserId) {
        // TODO: Implement user creation with Clerk user data
        // For now, return a basic user
        User user = new User();
        user.setUserId(clerkUserId);
        return userRepository.save(user);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/") || path.equals("/api/webhook/clerk");
    }
} 