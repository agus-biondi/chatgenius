package com.gauntletai.agustinbiondi.chatgenius.repository;

import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.File;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<File, UUID> {
    Page<File> findByChannelOrderByUploadedAtDesc(Channel channel, Pageable pageable);
    
    List<File> findByUploadedBy(User user);
    
    List<File> findByFilenameContainingIgnoreCase(String filename);
    
    void deleteByChannel(Channel channel);
} 