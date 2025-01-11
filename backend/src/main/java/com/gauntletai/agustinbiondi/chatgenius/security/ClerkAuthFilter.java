package com.gauntletai.agustinbiondi.chatgenius.security;

import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClerkAuthFilter extends OncePerRequestFilter {

    private final ClerkTokenValidator clerkTokenValidator;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        log.info("Processing request: {} {}", method, path);

        try {
            String token = extractToken(request);
            if (token != null) {
                log.debug("Found bearer token in request");
                String clerkUserId = clerkTokenValidator.verifyToken(token);
                log.debug("Token verified for Clerk user ID: {}", clerkUserId);
                setAuthentication(clerkUserId);
            } else {
                log.debug("No bearer token found in request");
            }
        } catch (Exception e) {
            log.error("Authentication failed for request {} {}: {}", method, path, e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        log.debug("Proceeding with filter chain for {} {}", method, path);
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void setAuthentication(String clerkUserId) {
        userRepository.findById(clerkUserId).ifPresent(user -> {
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()));
            log.debug("Setting authentication for user {} with role {}", user.getUserId(), user.getRole());
            var authentication = new UsernamePasswordAuthenticationToken(
                    user.getUserId(),
                    null,
                    authorities
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        });
    }
} 