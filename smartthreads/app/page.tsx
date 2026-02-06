import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
      <main className="max-w-xl text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          SmartThreads
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-8 leading-relaxed">
          Intent-based team chat that understands your messages.
          <br />
          <span className="text-zinc-500 dark:text-zinc-400">
            AI-powered categorization prevents repetitive questions
            and keeps conversations organized.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {session ? (
            <>
              <Link
                href="/threads"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to My Chats
              </Link>
              <Link
                href="/api/auth/signout"
                className="border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 px-6 py-3 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign Out
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Log In
            </Link>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <div className="text-2xl mb-2">🏷️</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Auto-Categorize</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Messages are tagged as Questions, Updates, Decisions, and more.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <div className="text-2xl mb-2">🔁</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Repetition Alert</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Get warned before asking something already answered.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Filter by Intent</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              View only Questions, Scheduling, or Concerns at a glance.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
