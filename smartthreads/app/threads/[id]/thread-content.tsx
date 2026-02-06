"use client";

import { useState } from "react";
import { MessageList } from "./message-list";
import { MessageForm } from "./message-form";
import { RepliesPanel } from "./replies-panel";

interface Message {
  id: string;
  content: string;
  category: string;
  createdAt: Date;
  authorId: string;
  author: { name: string | null; email: string };
  _count?: { replies: number };
}

interface ThreadContentProps {
  threadId: string;
  messages: Message[];
  currentUserId: string;
}

export function ThreadContent({
  threadId,
  messages,
  currentUserId,
}: ThreadContentProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );

  const handleOpenReplies = (messageId: string) => {
    setSelectedMessageId(messageId);
  };

  const handleCloseReplies = () => {
    setSelectedMessageId(null);
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            onOpenReplies={handleOpenReplies}
            selectedMessageId={selectedMessageId}
          />
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <MessageForm threadId={threadId} />
        </div>
      </div>

      {/* Replies panel (right side) */}
      {selectedMessageId && (
        <RepliesPanel
          threadId={threadId}
          parentMessageId={selectedMessageId}
          currentUserId={currentUserId}
          onClose={handleCloseReplies}
        />
      )}
    </div>
  );
}
