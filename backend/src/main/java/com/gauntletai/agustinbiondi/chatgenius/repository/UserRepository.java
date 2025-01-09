package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUserId(String userId);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.channelMemberships WHERE u.userId = :userId")
    Optional<User> findByUserIdWithMemberships(@Param("userId") String userId);
    
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    long countByRole(UserRole role);
} 