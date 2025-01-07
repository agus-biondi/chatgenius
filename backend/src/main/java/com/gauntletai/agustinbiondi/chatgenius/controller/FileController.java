package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.FileDto;
import com.gauntletai.agustinbiondi.chatgenius.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<FileDto> uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam("channelId") UUID channelId,
        @RequestHeader("X-User-ID") UUID userId
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(fileService.uploadFile(channelId, userId, file));
    }

    @GetMapping("/channel/{channelId}")
    public ResponseEntity<Page<FileDto>> getChannelFiles(
        @PathVariable UUID channelId,
        @RequestHeader("X-User-ID") UUID userId,
        Pageable pageable
    ) {
        return ResponseEntity.ok(fileService.getChannelFiles(channelId, userId, pageable));
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
        @PathVariable UUID fileId,
        @RequestHeader("X-User-ID") UUID userId
    ) throws IOException {
        fileService.deleteFile(fileId, userId);
        return ResponseEntity.noContent().build();
    }
} 