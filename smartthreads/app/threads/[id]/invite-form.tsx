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
    <div className="border-t pt-3 mt-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invite by email..."
          required
          className="flex-1 border rounded px-3 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "..." : "Add"}
        </button>
      </form>
      {message && (
        <p className={`text-sm mt-1 ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
