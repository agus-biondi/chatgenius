package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.UserDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.UpdateUserRequest;
import com.gauntletai.agustinbiondi.chatgenius.service.UserService;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/active")
    public List<UserDto> getActiveUsers() {
        return userService.getActiveUsers();
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDto> updateUser(
        @PathVariable String userId,
        @RequestBody UpdateUserRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        // Only allow users to update their own username
        if (!currentUser.getUserId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }

        UserDto updatedUser = userService.updateUser(userId, request);
        return ResponseEntity.ok(updatedUser);
    }
} 