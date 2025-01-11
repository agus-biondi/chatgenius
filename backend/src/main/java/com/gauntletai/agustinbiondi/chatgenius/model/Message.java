package com.gauntletai.agustinbiondi.chatgenius.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "messages",
       indexes = {
           @Index(name = "idx_messages_channel_created", columnList = "channel_id,created_at"),
           @Index(name = "idx_messages_parent", columnList = "parent_id")
       })
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
@ToString(exclude = {"createdBy", "channel", "reactions"})
@EqualsAndHashCode(of = "id")
public class Message {
    public enum Type {
        TEXT,           // Regular text message
        SYSTEM,         // System notification (user joined, etc.)
        FILE            // File attachment message
    }

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Type type = Type.TEXT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false, columnDefinition = "VARCHAR(255)")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Message parent;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Reaction> reactions = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant createdAt;

    @Column(name = "edited_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private Instant editedAt;

    @Column(name = "is_edited")
    @Builder.Default
    private boolean isEdited = false;

    /**
     * Thread structure:
     * - If message is not in a thread: parent = null
     * - If message is a reply: parent points to the thread's root message
     */
} 