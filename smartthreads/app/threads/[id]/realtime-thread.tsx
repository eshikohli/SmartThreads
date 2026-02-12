"use client";

import { useState, useCallback, useEffect } from "react";
import { MessageList } from "./message-list";
import { MessageForm } from "./message-form";
import { RepliesPanel } from "./replies-panel";
import { SummaryPanel } from "./summary-panel";
import { subscribeToChannel, unsubscribeFromChannel } from "@/app/lib/pusher-client";

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

interface PusherMessagePayload {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  author: { id: string; email: string; name: string | null };
  threadId: string;
  parentMessageId: string | null;
}

interface RealtimeThreadProps {
  threadId: string;
  initialMessages: Message[];
  currentUserId: string;
}

export function RealtimeThread({
  threadId,
  initialMessages,
  currentUserId,
}: RealtimeThreadProps) {
  // Messages state - initialized from server-fetched data
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  // Sidebar state
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("closed");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [summaryIntentFilter, setSummaryIntentFilter] = useState<string>("All");
  const [currentFilter, setCurrentFilter] = useState<string>("All");

  // Subscribe to Pusher channel for realtime updates
  useEffect(() => {
    const channelName = `thread-${threadId}`;
    const channel = subscribeToChannel(channelName);

    if (!channel) {
      return; // Pusher not configured
    }

    const handleNewMessage = (payload: PusherMessagePayload) => {
      // If it's a reply, increment the parent's reply count
      if (payload.parentMessageId !== null) {
        setMessages((prevMessages) =>
          prevMessages.map((m) =>
            m.id === payload.parentMessageId
              ? { ...m, _count: { replies: (m._count?.replies ?? 0) + 1 } }
              : m
          )
        );
        return;
      }

      // Handle top-level messages
      setMessages((prevMessages) => {
        // Check for duplicates
        if (prevMessages.some((m) => m.id === payload.id)) {
          return prevMessages;
        }

        // Append new message
        const newMessage: Message = {
          id: payload.id,
          content: payload.content,
          category: payload.category,
          createdAt: new Date(payload.createdAt),
          authorId: payload.author.id,
          author: {
            name: payload.author.name,
            email: payload.author.email,
          },
          _count: { replies: 0 },
        };

        return [...prevMessages, newMessage];
      });
    };

    channel.bind("new-message", handleNewMessage);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      unsubscribeFromChannel(channelName);
    };
  }, [threadId]);

  // Sidebar handlers
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
