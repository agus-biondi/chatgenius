package com.gauntletai.agustinbiondi.chatgenius.controller;

import com.gauntletai.agustinbiondi.chatgenius.dto.FileDto;
import com.gauntletai.agustinbiondi.chatgenius.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileDto> uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam("channelId") UUID channelId,
        @RequestHeader("X-User-ID") String userId
    ) throws IOException {
        System.out.println("POST /api/files - Uploading file. userId=" + userId + ", channelId=" + channelId + ", filename=" + file.getOriginalFilename());
        FileDto response = fileService.uploadFile(channelId, userId, file);
        System.out.println("POST /api/files - File uploaded. response=" + response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/channel/{channelId}")
    public ResponseEntity<Page<FileDto>> getChannelFiles(
        @PathVariable UUID channelId,
        @RequestHeader("X-User-ID") String userId,
        Pageable pageable
    ) {
        System.out.println("GET /api/files/channel/" + channelId + " - Getting files. userId=" + userId + ", pageable=" + pageable);
        Page<FileDto> response = fileService.getChannelFiles(channelId, userId, pageable);
        System.out.println("GET /api/files/channel/" + channelId + " - Retrieved " + response.getContent().size() + " files");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
        @PathVariable UUID fileId,
        @RequestHeader("X-User-ID") String userId
    ) throws IOException {
        System.out.println("DELETE /api/files/" + fileId + " - Deleting file. userId=" + userId);
        fileService.deleteFile(fileId, userId);
        System.out.println("DELETE /api/files/" + fileId + " - File deleted");
        return ResponseEntity.noContent().build();
    }
} 