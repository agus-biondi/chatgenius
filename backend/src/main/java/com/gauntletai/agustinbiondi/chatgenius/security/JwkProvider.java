package com.gauntletai.agustinbiondi.chatgenius.security;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.UrlJwkProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.security.interfaces.RSAPublicKey;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class JwkProvider {
    private final Map<String, RSAPublicKey> keyCache = new ConcurrentHashMap<>();
    private final UrlJwkProvider provider;

    public JwkProvider(
        @Value("${aws.cognito.region}") String region,
        @Value("${aws.cognito.userPoolId}") String userPoolId
    ) throws Exception {
        String urlStr = String.format("https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json", region, userPoolId);
        this.provider = new UrlJwkProvider(URI.create(urlStr).toURL());
    }

    public RSAPublicKey getPublicKey(String kid) throws Exception {
        return keyCache.computeIfAbsent(kid, k -> {
            try {
                Jwk jwk = provider.get(kid);
                return (RSAPublicKey) jwk.getPublicKey();
            } catch (Exception e) {
                throw new RuntimeException("Failed to get public key", e);
            }
        });
    }
} 