package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateUserRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.UserDto;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService {
    private static final String TEST_USER_ID = "test_11111111-1111-1111-1111-111111111111";
    
    private final UserRepository userRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void initOnStartup() {
        init();
    }

    public void init() {
        log.info("Initializing test user...");
        try {
            if (userRepository.findByUserId(TEST_USER_ID).isEmpty()) {
                log.info("Test user not found, creating...");
                User testUser = new User();
                testUser.setUserId(TEST_USER_ID);
                testUser.setUsername("Test User");
                testUser.setEmail("test@example.com");
                testUser.setRole(UserRole.ADMIN);
                userRepository.save(testUser);
                log.info("Test user created successfully");
            } else {
                log.info("Test user already exists");
            }
        } catch (Exception e) {
            log.error("Error creating test user", e);
        }
    }

    public UserDto createUser(CreateUserRequest request) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setUserId(request.getUserId());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(UserRole.USER);

        return toDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserDto getUser(String userId) {
        return userRepository.findByUserId(userId)
            .map(this::toDto)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public Page<UserDto> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
            .map(this::toDto);
    }

    public void deleteUser(String userId, String requesterId) {
        User requester = userRepository.findByUserId(requesterId)
            .orElseThrow(() -> new EntityNotFoundException("Requester not found"));

        // Only admin can delete users
        if (requester.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admin can delete users");
        }

        userRepository.deleteById(userId);
    }

    public void promoteToAdmin(String userId, String requesterId) {
        User requester = userRepository.findByUserId(requesterId)
            .orElseThrow(() -> new EntityNotFoundException("Requester not found"));

        // Only admin can promote users
        if (requester.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admin can promote users");
        }

        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setRole(UserRole.ADMIN);
        userRepository.save(user);
    }

    public void demoteToUser(String userId, String requesterId) {
        User requester = userRepository.findByUserId(requesterId)
            .orElseThrow(() -> new EntityNotFoundException("Requester not found"));

        // Only admin can demote users
        if (requester.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admin can demote users");
        }

        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Cannot demote last admin
        long adminCount = userRepository.countByRole(UserRole.ADMIN);
        if (adminCount == 1 && user.getRole() == UserRole.ADMIN) {
            throw new IllegalStateException("Cannot demote last admin");
        }

        user.setRole(UserRole.USER);
        userRepository.save(user);
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
} 