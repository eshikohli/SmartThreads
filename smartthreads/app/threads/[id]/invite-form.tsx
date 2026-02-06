"use client";

import { addMemberByEmail } from "@/app/lib/actions";
import { useState } from "react";

export function InviteForm({ threadId }: { threadId: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const result = await addMemberByEmail(threadId, email);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result.success) {
      setMessage({ type: "success", text: result.success });
      setEmail("");
    }

    setPending(false);
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invite by email..."
          required
          className="flex-1 border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-zinc-700 dark:bg-zinc-600 text-white px-3 py-1 rounded text-sm hover:bg-zinc-800 dark:hover:bg-zinc-500 disabled:opacity-50"
        >
          {pending ? "..." : "Add"}
        </button>
      </form>
      {message && (
        <p className={`text-sm mt-1 ${message.type === "error" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
