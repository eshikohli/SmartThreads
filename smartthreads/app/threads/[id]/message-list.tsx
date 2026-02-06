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
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
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
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto border rounded p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">
            No messages yet. Start the conversation!
          </p>
        ) : filteredMessages.length === 0 ? (
          <p className="text-gray-500 text-center">
            No {filter} messages in this thread.
          </p>
        ) : (
          filteredMessages.map((message) => {
            const isMine = message.authorId === currentUserId;

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
                    <p className="text-xs text-gray-500 mb-1 px-1">
                      {message.author.name || message.author.email}
                    </p>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isMine
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}
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
                    <span className="text-xs text-gray-400">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <CategoryTag category={message.category} />
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
