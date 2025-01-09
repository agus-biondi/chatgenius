package com.gauntletai.agustinbiondi.chatgenius.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwk.Jwk;
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
import java.net.URI;
import java.security.interfaces.RSAPublicKey;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ClerkAuthFilter extends OncePerRequestFilter {
    private final UserRepository userRepository;
    
    @Value("${clerk.issuer}")
    private String clerkIssuer;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            String sessionToken = token.substring(7);
            try {
                String clerkUserId = verifyAndGetClerkUserId(sessionToken);
                if (clerkUserId != null) {
                    userRepository.findByUserId(clerkUserId).ifPresent(user -> {
                        List<SimpleGrantedAuthority> authorities = 
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                        
                        UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(user, null, authorities);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
                }
            } catch (Exception e) {
                System.err.println("Error processing token: " + e.getMessage());
                e.printStackTrace();
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }

    private String verifyAndGetClerkUserId(String token) {
        try {
            DecodedJWT unverifiedJwt = JWT.decode(token);
            String jwksUrl = clerkIssuer + "/.well-known/jwks.json";
            JwkProvider provider = new UrlJwkProvider(URI.create(jwksUrl).toURL());
            Jwk jwk = provider.get(unverifiedJwt.getKeyId());
            
            Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);
            DecodedJWT jwt = JWT.require(algorithm)
                .withIssuer(clerkIssuer)
                .build()
                .verify(token);

            return jwt.getSubject();
        } catch (Exception e) {
            System.err.println("Failed to verify token: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/") || path.equals("/api/webhook/clerk");
    }
} 