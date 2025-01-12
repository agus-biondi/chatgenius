package com.gauntletai.agustinbiondi.chatgenius.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "reactions",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_reactions_message_user_emoji",
           columnNames = {"message_id", "user_id", "emoji"}
       ),
       indexes = {
           @Index(name = "idx_reactions_message", columnList = "message_id"),
           @Index(name = "idx_reactions_user", columnList = "user_id"),
           @Index(name = "idx_reactions_unique", columnList = "message_id,user_id,emoji", unique = true)
       })
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
@ToString(exclude = {"message", "user"})
@EqualsAndHashCode(of = "id")
public class Reaction {
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 32)
    private String emoji;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, columnDefinition = "VARCHAR(255)")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;
} 