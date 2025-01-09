package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Message;
import com.gauntletai.agustinbiondi.chatgenius.model.Reaction;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, UUID> {
    List<Reaction> findByMessage(Message message);
    
    Optional<Reaction> findByMessageAndUserAndEmoji(Message message, User user, String emoji);
    
    boolean existsByMessageAndUserAndEmoji(Message message, User user, String emoji);
    
    void deleteByMessage(Message message);
    
    void deleteByMessageAndUser(Message message, User user);

} 