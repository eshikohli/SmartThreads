import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getThreadMessages } from "@/app/lib/actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InviteForm } from "./invite-form";
import { MessageForm } from "./message-form";
import { MessageList } from "./message-list";
import { MembersModal } from "./members-modal";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const thread = await getThreadMessages(id);

  if (!thread) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-screen">
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <Link href="/threads" className="text-blue-600 hover:underline">
            &larr; Back
          </Link>
          <h1 className="text-xl font-bold">{thread.title || "Untitled Chat"}</h1>
          <MembersModal
            threadId={thread.id}
            memberCount={thread.members.length}
          />
        </div>
        <InviteForm threadId={thread.id} />
      </div>

      <div className="flex-1 flex flex-col mb-4 min-h-0">
        <MessageList
          messages={thread.messages}
          currentUserId={session.user.id}
        />
      </div>

      <MessageForm threadId={thread.id} />
    </div>
  );
}
