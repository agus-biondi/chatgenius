package com.gauntletai.agustinbiondi.chatgenius.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
public class ChannelMessagesDTO {
    private UUID parentMessageId;
    private String parentContent;
    private String parentCreatedBy;
    private String parentType;
    private long parentReplyCount;
    private Set<ReactionDTO> reactions;
    private List<MessageDTO> topReplies;

    // Constructor for JPQL projection
    public ChannelMessagesDTO(UUID parentMessageId, String parentContent, String parentCreatedBy,
                            String parentType, long parentReplyCount, Set<ReactionDTO> reactions,
                            List<MessageDTO> topReplies) {
        this.parentMessageId = parentMessageId;
        this.parentContent = parentContent;
        this.parentCreatedBy = parentCreatedBy;
        this.parentType = parentType;
        this.parentReplyCount = parentReplyCount;
        this.reactions = reactions;
        this.topReplies = topReplies;
    }
} 