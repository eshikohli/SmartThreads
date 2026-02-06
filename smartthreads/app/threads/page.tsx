import Link from "next/link";

export default function ThreadsPage() {
  return (
    <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200 mb-2">
          Select a chat
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">
          Choose a conversation from the sidebar or start a new one.
        </p>
        <Link
          href="/threads/new"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Start New Chat
        </Link>
      </div>
    </div>
  );
}
