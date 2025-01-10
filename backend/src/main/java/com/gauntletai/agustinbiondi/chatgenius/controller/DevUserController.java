package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.service.UserService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

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
            // Check if user already exists
            if (userService.userExists(request.getId())) {
                // User already exists, do nothing
                return ResponseEntity.ok().build();
            }

            // Use email as username if not provided
            String username = request.getEmail().split("@")[0];
            userService.createUser(
                request.getId(),
                request.getEmail(),
                username
            );
            return ResponseEntity.ok("User synced successfully");
        } catch (DataIntegrityViolationException e) {
            // If we get a unique constraint violation, return 409 Conflict
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("User already exists");
        } catch (IllegalArgumentException e) {
            // Invalid input data
            return ResponseEntity.badRequest()
                .body("Invalid input: " + e.getMessage());
        } catch (Exception e) {
            // Log the full stack trace for debugging
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
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