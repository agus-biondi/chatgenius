package com.gauntletai.agustinbiondi.chatgenius.service;

import com.gauntletai.agustinbiondi.chatgenius.dto.FileDto;
import com.gauntletai.agustinbiondi.chatgenius.model.Channel;
import com.gauntletai.agustinbiondi.chatgenius.model.File;
import com.gauntletai.agustinbiondi.chatgenius.model.User;
import com.gauntletai.agustinbiondi.chatgenius.model.UserRole;
import com.gauntletai.agustinbiondi.chatgenius.repository.ChannelRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.FileRepository;
import com.gauntletai.agustinbiondi.chatgenius.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FileService {
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final ChannelService channelService;

    private final Path fileStorageLocation = Paths.get("uploads");

    public FileDto uploadFile(UUID channelId, String userId, MultipartFile file) throws IOException {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Check if user is member of channel
        if (!channelService.isMember(channel, userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        // Create uploads directory if it doesn't exist
        Files.createDirectories(fileStorageLocation);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID().toString() + extension;
        Path targetLocation = fileStorageLocation.resolve(filename);

        // Save file to disk
        Files.copy(file.getInputStream(), targetLocation);

        // Create file record
        File fileEntity = new File();
        fileEntity.setFilename(originalFilename);
        fileEntity.setFileUrl("/uploads/" + filename);
        fileEntity.setUploadedBy(user);
        fileEntity.setChannel(channel);

        return toDto(fileRepository.save(fileEntity));
    }

    @Transactional(readOnly = true)
    public Page<FileDto> getChannelFiles(UUID channelId, String userId, Pageable pageable) {
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        // Check if user is member of channel
        if (!channelService.isMember(channel, userId)) {
            throw new AccessDeniedException("User is not a member of this channel");
        }

        return fileRepository.findByChannelOrderByUploadedAtDesc(channel, pageable)
            .map(this::toDto);
    }

    public void deleteFile(UUID fileId, String userId) throws IOException {
        File file = fileRepository.findById(fileId)
            .orElseThrow(() -> new EntityNotFoundException("File not found"));

        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Only file uploader, channel creator, or admin can delete
        if (!file.getUploadedBy().getUserId().equals(userId) && 
            !file.getChannel().getCreatedBy().getUserId().equals(userId) && 
            user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Not authorized to delete this file");
        }

        // Delete physical file
        String filename = file.getFileUrl().substring(file.getFileUrl().lastIndexOf("/") + 1);
        Path filePath = fileStorageLocation.resolve(filename);
        Files.deleteIfExists(filePath);

        // Delete database record
        fileRepository.delete(file);
    }

    private FileDto toDto(File file) {
        FileDto dto = new FileDto();
        dto.setId(file.getId());
        dto.setFilename(file.getFilename());
        dto.setFileUrl(file.getFileUrl());
        dto.setUploadedById(file.getUploadedBy().getUserId());
        dto.setUploadedByUsername(file.getUploadedBy().getUsername());
        dto.setChannelId(file.getChannel().getId());
        dto.setUploadedAt(file.getUploadedAt());
        return dto;
    }
} 