"use client";

import { getThreadMembers } from "@/app/lib/actions";
import { Modal, modalButtonStyles } from "@/app/components/modal";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  email: string;
  name: string | null;
}

interface MembersModalProps {
  threadId: string;
  memberCount: number;
}

export function MembersModal({ threadId, memberCount }: MembersModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && members.length === 0) {
      setLoading(true);
      getThreadMembers(threadId)
        .then(setMembers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, threadId, members.length]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
      >
        {memberCount} member{memberCount !== 1 && "s"}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Participants"
        footer={
          <button
            onClick={() => setIsOpen(false)}
            className={`w-full ${modalButtonStyles.secondary}`}
          >
            Close
          </button>
        }
      >
        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">
            Loading...
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">
                  {(member.name || member.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  {member.name && (
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {member.name}
                    </p>
                  )}
                  <p
                    className={`text-sm truncate ${
                      member.name
                        ? "text-zinc-500 dark:text-zinc-400"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {member.email}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
