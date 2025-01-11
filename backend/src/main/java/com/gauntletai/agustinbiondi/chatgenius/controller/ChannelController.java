package com.gauntletai.agustinbiondi.chatgenius.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {

    @GetMapping
    public ResponseEntity<Void> getChannels() {
        log.info("GET /api/channels endpoint hit");
        return ResponseEntity.ok().build();
    }
} 