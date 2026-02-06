"use client";

import { analyzeDraft, sendMessage } from "@/app/lib/actions";
import { useState } from "react";

interface RepetitiveWarning {
  category: string;
  suggestedAnswer?: string;
  matchedMessageId?: string;
}

export function MessageForm({ threadId }: { threadId: string }) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [warning, setWarning] = useState<RepetitiveWarning | null>(null);
  const [pendingCategory, setPendingCategory] = useState<string>("FYI");

  const handleSend = async (bypassWarning = false) => {
    if (!content.trim()) return;

    setPending(true);
    setWarning(null);

    try {
      if (!bypassWarning) {
        const analysis = await analyzeDraft(threadId, content);
        setPendingCategory(analysis.category);

        if (analysis.isRepetitive) {
          setWarning({
            category: analysis.category,
            suggestedAnswer: analysis.suggestedAnswer,
            matchedMessageId: analysis.matchedMessageId,
          });
          setPending(false);
          return;
        }

        await sendMessage(threadId, content, analysis.category);
      } else {
        await sendMessage(threadId, content, pendingCategory);
      }

      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(false);
  };

  const handleConfirmSend = () => {
    setWarning(null);
    handleSend(true);
  };

  const handleCancel = () => {
    setWarning(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          required
          disabled={pending}
          className="flex-1 border rounded px-3 py-2 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "..." : "Send"}
        </button>
      </form>

      {warning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-amber-600">
              Possible Duplicate
            </h3>
            <p className="text-gray-700 mb-4">
              This message seems to cover something already discussed:
            </p>
            {warning.suggestedAnswer && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                <p className="text-sm text-amber-800">{warning.suggestedAnswer}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-4">
              Category: <span className="font-medium">{warning.category}</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                Send anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
