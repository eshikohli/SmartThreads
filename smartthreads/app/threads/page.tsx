import { listThreads } from "@/app/lib/actions";
import { CategoryTag } from "@/app/components/category-tag";
import Link from "next/link";

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

export default async function ThreadsPage() {
  const threads = await listThreads();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Chats</h1>
        <Link
          href="/threads/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Chat
        </Link>
      </div>

      {threads.length === 0 ? (
        <p className="text-gray-500">No chats yet. Start a new one!</p>
      ) : (
        <ul className="space-y-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/threads/${thread.id}`}
                className="block border rounded p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {thread.title || "Untitled Chat"}
                      </span>
                      {thread.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>

                    {thread.latestMessage ? (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500 truncate flex-1">
                          {thread.latestMessage.content}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1 italic">
                        No messages yet
                      </p>
                    )}
                  </div>

                  {thread.latestMessage && (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(new Date(thread.latestMessage.createdAt))}
                      </span>
                      <CategoryTag category={thread.latestMessage.category} />
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
