package com.gauntletai.agustinbiondi.chatgenius.service;
import com.gauntletai.agustinbiondi.chatgenius.dto.UserDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.UpdateUserRequest;
import com.gauntletai.agustinbiondi.chatgenius.dto.WebSocketEventDto;
import com.gauntletai.agustinbiondi.chatgenius.dto.WebSocketEventDto.EventType;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelMembershipRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final ChannelMembershipRepository membershipRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<UserDto> getActiveUsers() {
        return userRepository.findAll().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(String userId) {
        return userRepository.findByUserId(userId)
            .map(this::toDto)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    @Transactional
    public UserDto createUser(String userId, String email, String username) {
        if (userRepository.findByUserId(userId).isPresent()) {
            throw new IllegalStateException("User already exists");
        }

        User user = new User();
        user.setUserId(userId);
        user.setEmail(email);
        user.setUsername(username);
        user.setRole(UserRole.USER);
        user = userRepository.save(user);

        return toDto(user);
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

    @Transactional
    public UserDto updateUser(String userId, UpdateUserRequest request) {
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            user.setUsername(request.getUsername());
            User savedUser = userRepository.save(user);

            // Get all channels where the user is a member
            Set<UUID> userChannels = membershipRepository.findByUser(user).stream()
                .map(membership -> membership.getChannel().getId())
                .collect(Collectors.toSet());

            // Create user update event
            Map<String, Object> payload = new HashMap<>();
            payload.put("username", savedUser.getUsername());

            WebSocketEventDto event = WebSocketEventDto.builder()
                .type(EventType.USER_UPDATE)
                .userId(userId)
                .timestamp(LocalDateTime.now())
                .payload(payload)
                .build();

            // Send to all channels where the user is a member
            userChannels.forEach(channelId -> {
                String channelTopic = String.format("/topic/channel/%s", channelId);
                messagingTemplate.convertAndSend(channelTopic, event);
            });
        }

        return toDto(user);
    }

    @Transactional
    public UserDto updateUserFromClerk(String userId, String email, String username) {
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        
        if (email != null) {
            user.setEmail(email);
        }
        if (username != null) {
            user.setUsername(username);
        }
        user = userRepository.save(user);
        return toDto(user);
    }

    @Transactional
    public void deleteUser(String userId) {
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public boolean userExists(String userId) {
        return userRepository.findByUserId(userId).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }
} 