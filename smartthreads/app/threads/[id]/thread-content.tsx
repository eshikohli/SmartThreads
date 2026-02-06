"use client";

import { useState, useCallback } from "react";
import { MessageList } from "./message-list";
import { MessageForm } from "./message-form";
import { RepliesPanel } from "./replies-panel";
import { SummaryPanel } from "./summary-panel";

type SidebarMode = "closed" | "replies" | "summary";

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
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("closed");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [summaryIntentFilter, setSummaryIntentFilter] = useState<string>("All");
  const [currentFilter, setCurrentFilter] = useState<string>("All");

  const handleOpenReplies = useCallback((messageId: string) => {
    setSelectedMessageId(messageId);
    setSidebarMode("replies");
  }, []);

  const handleOpenSummary = useCallback((intentFilter: string) => {
    setSummaryIntentFilter(intentFilter);
    setSidebarMode("summary");
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarMode("closed");
    setSelectedMessageId(null);
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    setCurrentFilter(filter);
  }, []);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            onOpenReplies={handleOpenReplies}
            selectedMessageId={sidebarMode === "replies" ? selectedMessageId : null}
            onSummarize={handleOpenSummary}
            onFilterChange={handleFilterChange}
          />
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <MessageForm threadId={threadId} />
        </div>
      </div>

      {/* Right sidebar - Replies or Summary */}
      {sidebarMode === "replies" && selectedMessageId && (
        <RepliesPanel
          threadId={threadId}
          parentMessageId={selectedMessageId}
          currentUserId={currentUserId}
          onClose={handleCloseSidebar}
        />
      )}

      {sidebarMode === "summary" && (
        <SummaryPanel
          threadId={threadId}
          intentFilter={summaryIntentFilter}
          onClose={handleCloseSidebar}
        />
      )}
    </div>
  );
}
