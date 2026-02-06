"use client";

import { useState } from "react";
import { CategoryTag } from "@/app/components/category-tag";

const CATEGORIES = [
  "All",
  "Question",
  "Update",
  "Concern",
  "Decision",
  "Scheduling",
  "FYI",
] as const;

type Category = (typeof CATEGORIES)[number];

interface Message {
  id: string;
  content: string;
  category: string;
  createdAt: Date;
  authorId: string;
  author: { name: string | null; email: string };
  _count?: { replies: number };
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onOpenReplies?: (messageId: string) => void;
  selectedMessageId?: string | null;
}

export function MessageList({
  messages,
  currentUserId,
  onOpenReplies,
  selectedMessageId,
}: MessageListProps) {
  const [filter, setFilter] = useState<Category>("All");

  const filteredMessages =
    filter === "All"
      ? messages
      : messages.filter((m) => m.category === filter);

  return (
    <>
      <div className="flex gap-1 mb-3 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              filter === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded p-4 space-y-3 bg-white dark:bg-zinc-900">
        {messages.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-center">
            No messages yet. Start the conversation!
          </p>
        ) : filteredMessages.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-center">
            No {filter} messages in this thread.
          </p>
        ) : (
          filteredMessages.map((message) => {
            const isMine = message.authorId === currentUserId;
            const replyCount = message._count?.replies ?? 0;
            const isSelected = selectedMessageId === message.id;

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 px-1">
                      {message.author.name || message.author.email}
                    </p>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isMine
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md"
                    } ${isSelected ? "ring-2 ring-blue-400" : ""}`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-2 mt-1 px-1 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <CategoryTag category={message.category} />

                    {/* Reply affordance */}
                    {onOpenReplies && (
                      <button
                        onClick={() => onOpenReplies(message.id)}
                        className={`text-xs hover:underline ${
                          replyCount > 0
                            ? "text-blue-600 dark:text-blue-400 font-medium"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {replyCount > 0
                          ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                          : "Reply"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
