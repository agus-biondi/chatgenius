package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.UserDTO;
import java.util.List;
import java.util.Optional;

public interface UserService {

    UserDTO createUser(String userId, String email, String username);
    void deleteUser(String userId);
    boolean userExists(String userId);
    Optional<UserDTO> findByUsername(String username);
    Optional<UserDTO> findByEmail(String email);
    Optional<UserDTO> findById(String userId);
    List<UserDTO> findAll();

} 