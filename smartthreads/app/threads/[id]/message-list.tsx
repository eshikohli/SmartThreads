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
  author: { name: string | null; email: string };
}

export function MessageList({ messages }: { messages: Message[] }) {
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
          filteredMessages.map((message) => (
            <div key={message.id} className="border-b pb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">
                  {message.author.name || message.author.email}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
                <CategoryTag category={message.category} />
              </div>
              <p className="mt-1">{message.content}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
