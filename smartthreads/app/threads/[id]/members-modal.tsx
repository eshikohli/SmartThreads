"use client";

import { getThreadMembers } from "@/app/lib/actions";
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
      >
        {memberCount} member{memberCount !== 1 && "s"}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Participants</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      {(member.name || member.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      {member.name && (
                        <p className="font-medium text-gray-900 truncate">
                          {member.name}
                        </p>
                      )}
                      <p
                        className={`text-sm truncate ${
                          member.name ? "text-gray-500" : "text-gray-900"
                        }`}
                      >
                        {member.email}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
