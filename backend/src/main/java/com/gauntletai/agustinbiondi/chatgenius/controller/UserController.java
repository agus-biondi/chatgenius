package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateUserRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.UserDto;
import com.gauntletai.agustinbiondi.chatgenius.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.createUser(request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @GetMapping
    public ResponseEntity<Page<UserDto>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(
        @PathVariable String userId,
        @RequestHeader("X-User-ID") String requesterId
    ) {
        userService.deleteUser(userId, requesterId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/promote")
    public ResponseEntity<Void> promoteToAdmin(
        @PathVariable String userId,
        @RequestHeader("X-User-ID") String requesterId
    ) {
        userService.promoteToAdmin(userId, requesterId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/demote")
    public ResponseEntity<Void> demoteToUser(
        @PathVariable String userId,
        @RequestHeader("X-User-ID") String requesterId
    ) {
        userService.demoteToUser(userId, requesterId);
        return ResponseEntity.ok().build();
    }
} 