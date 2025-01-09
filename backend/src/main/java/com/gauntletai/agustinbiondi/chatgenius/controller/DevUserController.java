package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.service.UserService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/dev")
@Profile("dev") // Only active in development profile
public class DevUserController {

    private final UserService userService;

    public DevUserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncUser(@RequestBody DevUserSyncRequest request) {
        try {
            // Use email as username if not provided
            String username = request.getEmail().split("@")[0];
            userService.createUser(
                request.getId(),
                request.getEmail(),
                username
            );
            return ResponseEntity.ok("User synced successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Failed to sync user: " + e.getMessage());
        }
    }
}

record DevUserSyncRequest(
    String id,
    String email
) {
    public String getId() { return id; }
    public String getEmail() { return email; }
} 