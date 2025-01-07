package com.gauntletai.agustinbiondi.chatgenius.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
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
import java.security.interfaces.RSAPublicKey;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AwsCognitoJwtAuthenticationFilter extends OncePerRequestFilter {
    private final UserRepository userRepository;
    private final JwkProvider jwkProvider;

    @Value("${aws.cognito.userPoolId}")
    private String userPoolId;

    @Value("${aws.cognito.region}")
    private String region;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null) {
            try {
                DecodedJWT jwt = JWT.decode(token);
                String kid = jwt.getKeyId();
                RSAPublicKey publicKey = jwkProvider.getPublicKey(kid);

                Algorithm algorithm = Algorithm.RSA256(publicKey, null);
                JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(String.format("https://cognito-idp.%s.amazonaws.com/%s", region, userPoolId))
                    .build();

                jwt = verifier.verify(token);
                String email = jwt.getClaim("email").asString();

                Optional<User> userOpt = userRepository.findByEmail(email);
                User user;

                if (userOpt.isEmpty()) {
                    // Auto-create user if not exists
                    user = new User();
                    user.setEmail(email);
                    user.setUsername(jwt.getClaim("cognito:username").asString());
                    user.setRole(UserRole.USER);
                    user = userRepository.save(user);
                } else {
                    user = userOpt.get();
                }

                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                var authentication = new UsernamePasswordAuthenticationToken(user, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                // Invalid token, continue without authentication
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/");
    }
} 