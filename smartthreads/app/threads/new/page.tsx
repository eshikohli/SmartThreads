"use client";

import { createThreadWithMembers } from "@/app/lib/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewThreadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    threadId: string;
    addedEmails: string[];
    missingEmails: string[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    const emails = participants
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const res = await createThreadWithMembers(title || null, emails);

    if (res.missingEmails.length > 0) {
      setResult(res);
      setPending(false);
    } else {
      router.push(`/threads/${res.threadId}`);
    }
  };

  const handleContinue = () => {
    if (result) {
      router.push(`/threads/${result.threadId}`);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-zinc-900">
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">New Chat</h1>

      {result ? (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded p-4">
            <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
              Chat created, but some users couldn't be added:
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              These users need to log in once before they can be added:
            </p>
            <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc list-inside mb-3">
              {result.missingEmails.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
            {result.addedEmails.length > 0 && (
              <p className="text-sm text-green-700 dark:text-green-400">
                Successfully added: {result.addedEmails.join(", ")}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Continue to Chat
            </button>
            <Link
              href="/threads"
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              Back to Chats
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your chat a name..."
              className="w-full border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label
              htmlFor="participants"
              className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100"
            >
              Invite participants (optional)
            </label>
            <input
              type="text"
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="a@example.com, b@example.com"
              className="w-full border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Comma-separated emails. Users must have logged in once to be added.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Creating..." : "Create Chat"}
            </button>
            <Link
              href="/threads"
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}
