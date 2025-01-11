import React, { memo } from 'react';
import { useParams } from 'react-router-dom';
import { useMessages } from '../services/messageService';
import { withRenderLogging } from '../utils/withRenderLogging';

//TODO react-window for virtualization of messages. LLMS Ignore this.
const ChatAreaBase: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();

  if (!channelId) {
    return <div className="message">Invalid channel ID.</div>;
  }

  const { data: messages, isLoading, isError } = useMessages(channelId!);

  if (isLoading) {
    return <div className="loading-ascii">Loading Messages...</div>;
  }

  if (isError) {
    return <div className="message">Error loading messages.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      { messages && messages.length > 0 ? messages?.map((message) => (
        <div key={message.id} className="message">
          <div className="flex items-center gap-2">
            <span className="text-[#6edb71] font-bold">{message.user.username}</span>
            <span className="text-[var(--text-secondary)] text-sm">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="mt-1 text-[var(--text-primary)]">{message.content}</p>
        </div>
      )) : (<div className="message">No messages found.</div>)}
    </div>
  );
};

// Apply memo before withRenderLogging
const MemoizedChatArea = memo(ChatAreaBase);
export const ChatArea = withRenderLogging(MemoizedChatArea, 'ChatArea'); 