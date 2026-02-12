"use client";

import { CategoryTag } from "@/app/components/category-tag";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { subscribeToChannel } from "@/app/lib/pusher-client";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

interface Thread {
  id: string;
  title: string | null;
  latestMessage: {
    content: string;
    category: string;
    createdAt: Date;
    author: {
      id: string;
      email: string;
      name: string | null;
    };
  } | null;
  unreadCount: number;
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

interface ThreadSidebarProps {
  threads: Thread[];
  currentUserId: string;
}

export function ThreadSidebar({ threads: initialThreads, currentUserId }: ThreadSidebarProps) {
  const pathname = usePathname();
  const [threads, setThreads] = useState<Thread[]>(initialThreads);

  // Get the currently viewed thread ID from the pathname
  const currentThreadId = pathname?.match(/\/threads\/([^/]+)/)?.[1] ?? null;

  // Subscribe to all thread channels for realtime updates
  useEffect(() => {
    const handlers: Array<{ channel: ReturnType<typeof subscribeToChannel>; handler: (payload: PusherMessagePayload) => void }> = [];

    threads.forEach((thread) => {
      const channelName = `thread-${thread.id}`;
      const channel = subscribeToChannel(channelName);

      if (!channel) return;

      const handleNewMessage = (payload: PusherMessagePayload) => {
        // Only handle top-level messages for sidebar updates
        if (payload.parentMessageId !== null) return;

        setThreads((prevThreads) =>
          prevThreads.map((t) => {
            if (t.id !== payload.threadId) return t;

            // Update latest message
            const updatedThread: Thread = {
              ...t,
              latestMessage: {
                content: payload.content,
                category: payload.category,
                createdAt: new Date(payload.createdAt),
                author: {
                  id: payload.author.id,
                  email: payload.author.email,
                  name: payload.author.name,
                },
              },
            };

            // Only increment unread if:
            // 1. User is not currently viewing this thread
            // 2. Message is not from the current user
            if (currentThreadId !== payload.threadId && payload.author.id !== currentUserId) {
              updatedThread.unreadCount = t.unreadCount + 1;
            }

            return updatedThread;
          })
        );
      };

      channel.bind("new-message", handleNewMessage);
      handlers.push({ channel, handler: handleNewMessage });
    });

    return () => {
      handlers.forEach(({ channel, handler }) => {
        if (channel) {
          channel.unbind("new-message", handler);
        }
      });
    };
  }, [threads.length, currentThreadId, currentUserId]);

  // Reset unread count when viewing a thread
  useEffect(() => {
    if (currentThreadId) {
      setThreads((prevThreads) =>
        prevThreads.map((t) =>
          t.id === currentThreadId ? { ...t, unreadCount: 0 } : t
        )
      );
    }
  }, [currentThreadId]);

  return (
    <div className="w-80 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">My Chats</h1>
          <Link
            href="/threads/new"
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            New Chat
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm p-4">No chats yet.</p>
        ) : (
          <ul>
            {threads.map((thread) => {
              const isSelected = pathname === `/threads/${thread.id}`;
              const isMyMessage =
                thread.latestMessage?.author.id === currentUserId;
              const authorLabel = isMyMessage
                ? "You"
                : thread.latestMessage?.author.name ||
                  thread.latestMessage?.author.email;

              return (
                <li key={thread.id}>
                  <Link
                    href={`/threads/${thread.id}`}
                    className={`block p-3 border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm truncate text-zinc-900 dark:text-zinc-100 ${
                              isSelected ? "font-semibold" : "font-medium"
                            }`}
                          >
                            {thread.title || "Untitled Chat"}
                          </span>
                          {thread.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>

                        {thread.latestMessage ? (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                            <span className="font-medium">{authorLabel}:</span>{" "}
                            {thread.latestMessage.content}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 italic">
                            No messages yet
                          </p>
                        )}
                      </div>

                      {thread.latestMessage && (
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {formatRelativeTime(
                              new Date(thread.latestMessage.createdAt)
                            )}
                          </span>
                          <CategoryTag category={thread.latestMessage.category} />
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
