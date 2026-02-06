import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getThreadMessages } from "@/app/lib/actions";
import { notFound, redirect } from "next/navigation";
import { InviteForm } from "./invite-form";
import { MembersModal } from "./members-modal";
import { ThreadContent } from "./thread-content";

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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {thread.title || "Untitled Chat"}
          </h1>
          <MembersModal
            threadId={thread.id}
            memberCount={thread.members.length}
          />
        </div>
        <InviteForm threadId={thread.id} />
      </div>

      <ThreadContent
        threadId={thread.id}
        messages={thread.messages}
        currentUserId={session.user.id}
      />
    </div>
  );
}
