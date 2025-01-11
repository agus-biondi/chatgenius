package com.gauntletai.agustinbiondi.chatgenius.security;

import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class ClerkTokenValidator {

    private final JwkProvider jwkProvider;
    private final String clerkIssuer;

    public ClerkTokenValidator(
            @Value("${clerk.issuer}") String clerkIssuer
    ) {
        this.clerkIssuer = clerkIssuer;
        this.jwkProvider = new JwkProviderBuilder(getJwksUrl(clerkIssuer))
                .cached(10, 24, TimeUnit.HOURS) // Cache up to 10 JWKs for 24 hours
                .rateLimited(10, 1, TimeUnit.MINUTES) // Max 10 requests per minute
                .build();
    }

    private URL getJwksUrl(String issuer) {
        try {
            return URI.create(issuer + "/.well-known/jwks.json").toURL();
        } catch (Exception e) {
            throw new RuntimeException("Invalid JWKS URL", e);
        }
    }

    public String verifyToken(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            
            // Get the public key from Clerk's JWKS endpoint
            RSAPublicKey publicKey = (RSAPublicKey) jwkProvider.get(jwt.getKeyId()).getPublicKey();
            
            // Create a verifier for this specific token
            Algorithm algorithm = Algorithm.RSA256(publicKey, null);
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(clerkIssuer)
                    .build();
            
            // Verify the token
            jwt = verifier.verify(token);
            
            // Return the Clerk User ID (subject)
            return jwt.getSubject();
            
        } catch (JWTVerificationException e) {
            log.error("Token verification failed", e);
            throw new JWTVerificationException("Invalid token", e);
        } catch (Exception e) {
            log.error("Token processing failed", e);
            throw new RuntimeException("Token processing failed", e);
        }
    }
} 