import { listThreads } from "@/app/lib/actions";
import { ThreadSidebar } from "./thread-sidebar";

export default async function ThreadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { threads, currentUserId } = await listThreads();

  return (
    <div className="flex h-screen">
      <ThreadSidebar threads={threads} currentUserId={currentUserId} />
      <main className="flex-1 overflow-hidden bg-white dark:bg-zinc-900">{children}</main>
    </div>
  );
}
