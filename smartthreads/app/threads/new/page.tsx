import { createThread } from "@/app/lib/actions";
import Link from "next/link";

export default function NewThreadPage() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">New Chat</h1>

      <form action={createThread} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title (optional)
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Give your chat a name..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Chat
          </button>
          <Link
            href="/threads"
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
