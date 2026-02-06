"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { analyzeMessage, summarizeMessages, type AnalysisResult, type SummaryResult } from "./llm";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

async function verifyMembership(threadId: string, userId: string) {
  const membership = await prisma.threadMember.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  return !!membership;
}

export async function listThreads() {
  const user = await getCurrentUser();

  const threads = await prisma.thread.findMany({
    where: {
      members: { some: { userId: user.id } },
    },
    include: {
      members: {
        where: { userId: user.id },
        select: { lastSeenAt: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          category: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute unread counts
  const threadsWithUnread = await Promise.all(
    threads.map(async (thread) => {
      const membership = thread.members[0];
      const lastSeenAt = membership?.lastSeenAt;

      const unreadCount = await prisma.message.count({
        where: {
          threadId: thread.id,
          authorId: { not: user.id },
          ...(lastSeenAt
            ? { createdAt: { gt: lastSeenAt } }
            : {}),
        },
      });

      const latestMessage = thread.messages[0] || null;

      return {
        id: thread.id,
        title: thread.title,
        latestMessage: latestMessage
          ? {
              content: latestMessage.content,
              category: latestMessage.category,
              createdAt: latestMessage.createdAt,
              author: {
                id: latestMessage.author.id,
                email: latestMessage.author.email,
                name: latestMessage.author.name,
              },
            }
          : null,
        unreadCount,
      };
    })
  );

  return {
    threads: threadsWithUnread,
    currentUserId: user.id,
  };
}

export async function createThread(formData: FormData) {
  const user = await getCurrentUser();
  const title = formData.get("title") as string | null;

  const thread = await prisma.thread.create({
    data: {
      title: title || null,
      createdById: user.id,
      members: {
        create: { userId: user.id },
      },
    },
  });

  redirect(`/threads/${thread.id}`);
}

export async function getThreadMessages(threadId: string) {
  const user = await getCurrentUser();

  const isMember = await verifyMembership(threadId, user.id);
  if (!isMember) {
    throw new Error("Access denied");
  }

  // Mark thread as seen
  await prisma.threadMember.update({
    where: { threadId_userId: { threadId, userId: user.id } },
    data: { lastSeenAt: new Date() },
  });

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      members: { include: { user: true } },
      messages: {
        where: { parentMessageId: null }, // Only top-level messages
        include: {
          author: true,
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return thread;
}

export async function getReplyThread(threadId: string, parentMessageId: string) {
  const user = await getCurrentUser();

  const isMember = await verifyMembership(threadId, user.id);
  if (!isMember) {
    throw new Error("Access denied");
  }

  // Verify the parent message belongs to this thread AND is top-level
  const parentMessage = await prisma.message.findFirst({
    where: {
      id: parentMessageId,
      threadId,
      parentMessageId: null, // Must be top-level
    },
    include: {
      author: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  if (!parentMessage) {
    throw new Error("Parent message not found or is not a top-level message");
  }

  // Fetch replies
  const replies = await prisma.message.findMany({
    where: { parentMessageId },
    include: {
      author: {
        select: { id: true, email: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return { parentMessage, replies };
}

export async function sendReply(
  threadId: string,
  parentMessageId: string,
  content: string
) {
  const user = await getCurrentUser();

  if (!content?.trim()) {
    throw new Error("Content is required");
  }

  const isMember = await verifyMembership(threadId, user.id);
  if (!isMember) {
    throw new Error("Access denied");
  }

  // Fetch parent message for category and threadId validation
  const parentMessage = await prisma.message.findFirst({
    where: {
      id: parentMessageId,
      threadId,
      parentMessageId: null, // Must be top-level
    },
  });

  if (!parentMessage) {
    throw new Error("Parent message not found or is not a top-level message");
  }

  // Create reply with inherited category
  await prisma.message.create({
    data: {
      content: content.trim(),
      category: parentMessage.category, // Inherit parent's category
      threadId,
      authorId: user.id,
      parentMessageId,
    },
  });

  revalidatePath(`/threads/${threadId}`);
}

export async function sendMessage(
  threadId: string,
  content: string,
  category: string = "FYI"
) {
  const user = await getCurrentUser();

  if (!threadId || !content?.trim()) {
    throw new Error("Missing threadId or content");
  }

  const isMember = await verifyMembership(threadId, user.id);
  if (!isMember) {
    throw new Error("Access denied");
  }

  await prisma.message.create({
    data: {
      content: content.trim(),
      category,
      threadId,
      authorId: user.id,
    },
  });

  revalidatePath(`/threads/${threadId}`);
}

export async function analyzeDraft(
  threadId: string,
  draft: string
): Promise<AnalysisResult> {
  const user = await getCurrentUser();

  const isMember = await verifyMembership(threadId, user.id);
  if (!isMember) {
    throw new Error("Access denied");
  }

  const recentMessages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      content: true,
      category: true,
      createdAt: true,
    },
  });

  const history = recentMessages.reverse().map((m) => ({
    id: m.id,
    content: m.content,
    category: m.category,
    timestamp: m.createdAt.toISOString(),
  }));

  return analyzeMessage(draft, history);
}

export async function createThreadWithMembers(
  title: string | null,
  participantEmails: string[]
) {
  const user = await getCurrentUser();

  // Normalize emails: trim, lowercase, dedupe, remove empty
  const normalizedEmails = [
    ...new Set(
      participantEmails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0 && e !== user.email?.toLowerCase())
    ),
  ];

  // Create thread with creator as member
  const thread = await prisma.thread.create({
    data: {
      title: title || null,
      createdById: user.id,
      members: {
        create: { userId: user.id },
      },
    },
  });

  const addedEmails: string[] = [];
  const missingEmails: string[] = [];

  // Process each email
  for (const email of normalizedEmails) {
    const targetUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!targetUser) {
      missingEmails.push(email);
      continue;
    }

    // Check if already a member (shouldn't happen for new thread, but be safe)
    const existingMembership = await prisma.threadMember.findUnique({
      where: { threadId_userId: { threadId: thread.id, userId: targetUser.id } },
    });

    if (!existingMembership) {
      await prisma.threadMember.create({
        data: { threadId: thread.id, userId: targetUser.id },
      });
      addedEmails.push(targetUser.email);
    }
  }

  return {
    threadId: thread.id,
    addedEmails,
    missingEmails,
  };
}

export async function addMemberByEmail(threadId: string, email: string) {
  const user = await getCurrentUser();

  if (!email?.trim()) {
    return { error: "Email is required" };
  }

  const isMember = await verifyMembership(threadId, user.id);
  if (!isMember) {
    return { error: "Access denied" };
  }

  const targetUser = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
  });

  if (!targetUser) {
    return { error: "User must log in once before being added" };
  }

  const existingMembership = await prisma.threadMember.findUnique({
    where: { threadId_userId: { threadId, userId: targetUser.id } },
  });

  if (existingMembership) {
    return { error: "User is already a member of this chat" };
  }

  await prisma.threadMember.create({
    data: { threadId, userId: targetUser.id },
  });

  revalidatePath(`/threads/${threadId}`);
  return { success: `Added ${targetUser.email} to the chat` };
}

export async function getThreadMembers(threadId: string) {
  const user = await getCurrentUser();

  const isMember = await verifyMembership(threadId, user.id);
  if (!isMember) {
    throw new Error("Access denied");
  }

  const members = await prisma.threadMember.findMany({
    where: { threadId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return members.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    name: m.user.name,
  }));
}

export async function getThreadSummary(
  threadId: string,
  intentFilter: string
): Promise<SummaryResult> {
  const user = await getCurrentUser();

  const isMember = await verifyMembership(threadId, user.id);
  if (!isMember) {
    throw new Error("Access denied");
  }

  // Build query based on intent filter
  const whereClause: { threadId: string; category?: string } = { threadId };
  if (intentFilter !== "All") {
    whereClause.category = intentFilter;
  }

  // Fetch most recent 30 messages matching the filter
  const messages = await prisma.message.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Reverse to get chronological order for the LLM
  const chronologicalMessages = messages.reverse();

  // Transform to the format expected by summarizeMessages
  const summaryMessages = chronologicalMessages.map((m) => ({
    id: m.id,
    content: m.content,
    category: m.category,
    createdAt: m.createdAt.toISOString(),
    authorName: m.author.name,
    authorEmail: m.author.email,
    parentMessageId: m.parentMessageId,
  }));

  return summarizeMessages(summaryMessages, intentFilter);
}
