package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.CreateUserRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.UserDto;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;

    public UserDto createUser(CreateUserRequest request) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(UserRole.USER);

        return toDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserDto getUser(UUID userId) {
        return userRepository.findById(userId)
            .map(this::toDto)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public Page<UserDto> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
            .map(this::toDto);
    }

    public void deleteUser(UUID userId, UUID requesterId) {
        User requester = userRepository.findById(requesterId)
            .orElseThrow(() -> new EntityNotFoundException("Requester not found"));

        // Only admin can delete users
        if (requester.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admin can delete users");
        }

        userRepository.deleteById(userId);
    }

    public void promoteToAdmin(UUID userId, UUID requesterId) {
        User requester = userRepository.findById(requesterId)
            .orElseThrow(() -> new EntityNotFoundException("Requester not found"));

        // Only admin can promote users
        if (requester.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admin can promote users");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setRole(UserRole.ADMIN);
        userRepository.save(user);
    }

    public void demoteToUser(UUID userId, UUID requesterId) {
        User requester = userRepository.findById(requesterId)
            .orElseThrow(() -> new EntityNotFoundException("Requester not found"));

        // Only admin can demote users
        if (requester.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admin can demote users");
        }

        User user = userRepository.findById(userId)
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
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
} 