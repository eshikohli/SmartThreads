import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-gray-50">
      <main className="max-w-xl text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SmartThreads
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Intent-based team chat that understands your messages.
          <br />
          <span className="text-gray-500">
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
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
          <div className="p-4 rounded-lg bg-white border">
            <div className="text-2xl mb-2">🏷️</div>
            <h3 className="font-semibold text-gray-900 mb-1">Auto-Categorize</h3>
            <p className="text-sm text-gray-500">
              Messages are tagged as Questions, Updates, Decisions, and more.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white border">
            <div className="text-2xl mb-2">🔁</div>
            <h3 className="font-semibold text-gray-900 mb-1">Repetition Alert</h3>
            <p className="text-sm text-gray-500">
              Get warned before asking something already answered.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white border">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-1">Filter by Intent</h3>
            <p className="text-sm text-gray-500">
              View only Questions, Scheduling, or Concerns at a glance.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
