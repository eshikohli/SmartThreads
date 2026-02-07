"use client";

import { getReplyThread, sendReply } from "@/app/lib/actions";
import { CategoryTag } from "@/app/components/category-tag";
import { useEffect, useState, useCallback } from "react";
import { subscribeToChannel, unsubscribeFromChannel } from "@/app/lib/pusher-client";

interface Author {
  id: string;
  email: string;
  name: string | null;
}

interface Message {
  id: string;
  content: string;
  category: string;
  createdAt: Date;
  authorId: string;
  author: Author;
}

interface ReplyThread {
  parentMessage: Message;
  replies: Message[];
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

interface RepliesPanelProps {
  threadId: string;
  parentMessageId: string;
  currentUserId: string;
  onClose: () => void;
}

export function RepliesPanel({
  threadId,
  parentMessageId,
  currentUserId,
  onClose,
}: RepliesPanelProps) {
  const [data, setData] = useState<ReplyThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const loadReplies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getReplyThread(threadId, parentMessageId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load replies");
    } finally {
      setLoading(false);
    }
  }, [threadId, parentMessageId]);

  // Initial fetch
  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  // Subscribe to Pusher for realtime reply updates
  useEffect(() => {
    const channelName = `thread-${threadId}`;
    const channel = subscribeToChannel(channelName);

    if (!channel) {
      return; // Pusher not configured
    }

    const handleNewMessage = (payload: PusherMessagePayload) => {
      // Only handle replies to the currently open parent message
      if (payload.parentMessageId !== parentMessageId) {
        return;
      }

      setData((prevData) => {
        if (!prevData) return prevData;

        // Check for duplicates
        if (prevData.replies.some((r) => r.id === payload.id)) {
          return prevData;
        }

        // Append new reply
        const newReply: Message = {
          id: payload.id,
          content: payload.content,
          category: payload.category,
          createdAt: new Date(payload.createdAt),
          authorId: payload.author.id,
          author: {
            id: payload.author.id,
            name: payload.author.name,
            email: payload.author.email,
          },
        };

        return {
          ...prevData,
          replies: [...prevData.replies, newReply],
        };
      });
    };

    channel.bind("new-message", handleNewMessage);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      // Note: Don't unsubscribe here since RealtimeThread may also be using this channel
    };
  }, [threadId, parentMessageId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || sending) return;

    setSending(true);
    try {
      await sendReply(threadId, parentMessageId, replyContent);
      setReplyContent("");
      // Don't need to reload - Pusher will deliver the new reply in realtime
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="w-[400px] border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Replies
        </h2>
        <button
          onClick={onClose}
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xl leading-none px-2"
          aria-label="Close replies"
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
            Loading...
          </p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400 text-center py-8">
            {error}
          </p>
        ) : data ? (
          <>
            {/* Parent message */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                Original message
              </p>
              <MessageBubble
                message={data.parentMessage}
                currentUserId={currentUserId}
                formatTime={formatTime}
              />
            </div>

            {/* Replies */}
            <div className="space-y-3">
              {data.replies.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm py-4">
                  No replies yet. Start the thread!
                </p>
              ) : (
                data.replies.map((reply) => (
                  <MessageBubble
                    key={reply.id}
                    message={reply}
                    currentUserId={currentUserId}
                    formatTime={formatTime}
                  />
                ))
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Reply composer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <form onSubmit={handleSendReply} className="flex gap-2">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            disabled={sending || loading}
            className="flex-1 border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 text-sm disabled:opacity-50 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={sending || !replyContent.trim()}
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "..." : "Reply"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Reusable message bubble component
function MessageBubble({
  message,
  currentUserId,
  formatTime,
}: {
  message: Message;
  currentUserId: string;
  formatTime: (date: Date) => string;
}) {
  const isMine = message.authorId === currentUserId;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 px-1">
            {message.author.name || message.author.email}
          </p>
        )}

        <div
          className={`rounded-2xl px-3 py-2 ${
            isMine
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        </div>

        <div
          className={`flex items-center gap-2 mt-1 px-1 ${
            isMine ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatTime(message.createdAt)}
          </span>
          <CategoryTag category={message.category} />
        </div>
      </div>
    </div>
  );
}
