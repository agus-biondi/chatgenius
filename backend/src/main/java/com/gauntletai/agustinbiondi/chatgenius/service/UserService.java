package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import com.gauntletai.agustinbiondi.chatgenius.dto.UserDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getActiveUsers() {
        return userRepository.findAll().stream()
            .map(user -> {
                UserDto dto = new UserDto();
                dto.setUserId(user.getUserId());
                dto.setUsername(user.getUsername());
                dto.setEmail(user.getEmail());
                dto.setRole(user.getRole());
                dto.setCreatedAt(user.getCreatedAt());
                return dto;
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public void createUser(String userId, String email, String username) {
        User user = new User();
        user.setUserId(userId);
        user.setEmail(email);
        user.setUsername(username);
        user.setRole(UserRole.USER); // Default role for new users
        userRepository.save(user);
    }

    @Transactional
    public void updateUser(String userId, String email, String username) {
        userRepository.findByUserId(userId).ifPresent(user -> {
            user.setEmail(email);
            user.setUsername(username);
            userRepository.save(user);
        });
    }

    @Transactional
    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    @Transactional(readOnly = true)
    public boolean userExists(String userId) {
        return userRepository.findByUserId(userId).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }
} 