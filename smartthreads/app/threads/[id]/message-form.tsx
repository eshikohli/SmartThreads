"use client";

import { analyzeDraft, sendMessage } from "@/app/lib/actions";
import { Modal, modalButtonStyles } from "@/app/components/modal";
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
          className="flex-1 border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 disabled:opacity-50 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className={`${modalButtonStyles.primary} disabled:opacity-50`}
        >
          {pending ? "..." : "Send"}
        </button>
      </form>

      <Modal
        isOpen={!!warning}
        onClose={handleCancel}
        title="Possible Duplicate"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={handleCancel} className={modalButtonStyles.secondary}>
              Cancel
            </button>
            <button onClick={handleConfirmSend} className={modalButtonStyles.warning}>
              Send anyway
            </button>
          </div>
        }
      >
        <p className="text-zinc-700 dark:text-zinc-200 mb-4">
          This message seems to cover something already discussed:
        </p>
        {warning?.suggestedAnswer && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded p-3 mb-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {warning.suggestedAnswer}
            </p>
          </div>
        )}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Category:{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {warning?.category}
          </span>
        </p>
      </Modal>
    </>
  );
}
