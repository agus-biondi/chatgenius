package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.JsonNode;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@RestController
@RequestMapping("/api/webhook/clerk")
public class ClerkWebhookController {

    @Value("${clerk.webhook-secret}")
    private String webhookSecret;

    private final UserService userService;

    public ClerkWebhookController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody JsonNode payload,
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature
    ) {
        try {
            if (!verifyWebhookSignature(svixId, svixTimestamp, payload.toString(), svixSignature)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
            }

            String eventType = payload.get("type").asText();
            JsonNode data = payload.get("data");

            switch (eventType) {
                case "user.created":
                    handleUserCreated(data);
                    break;
                case "user.updated":
                    handleUserUpdated(data);
                    break;
                case "user.deleted":
                    handleUserDeleted(data);
                    break;
            }

            return ResponseEntity.ok("Webhook processed");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing webhook: " + e.getMessage());
        }
    }

    private void handleUserCreated(JsonNode data) {
        userService.createUser(
            data.get("id").asText(),
            data.path("email_addresses").get(0).path("email_address").asText(),
            data.path("username").asText(data.path("email_addresses").get(0).path("email_address").asText())
        );
    }

    private void handleUserUpdated(JsonNode data) {
        userService.updateUser(
            data.get("id").asText(),
            data.path("email_addresses").get(0).path("email_address").asText(),
            data.path("username").asText(data.path("email_addresses").get(0).path("email_address").asText())
        );
    }

    private void handleUserDeleted(JsonNode data) {
        userService.deleteUser(data.get("id").asText());
    }

    private boolean verifyWebhookSignature(String svixId, String svixTimestamp, String payload, String signature) {
        try {
            String toSign = svixId + "." + svixTimestamp + "." + payload;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                webhookSecret.getBytes(StandardCharsets.UTF_8), 
                "HmacSHA256"
            );
            mac.init(secretKeySpec);
            String computedSignature = Base64.getEncoder()
                .encodeToString(mac.doFinal(toSign.getBytes(StandardCharsets.UTF_8)));
            return signature.equals("v1," + computedSignature);
        } catch (Exception e) {
            return false;
        }
    }
} 