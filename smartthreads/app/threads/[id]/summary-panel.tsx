"use client";

import { getThreadSummary } from "@/app/lib/actions";
import { useEffect, useState, useCallback, useRef } from "react";

interface SummaryCacheEntry {
  bullets: string[];
  timestamp: number;
}

// Module-level cache for summaries (survives component remounts)
const summaryCache = new Map<string, SummaryCacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function getCacheKey(threadId: string, intentFilter: string): string {
  return `${threadId}:${intentFilter}`;
}

function getCachedSummary(threadId: string, intentFilter: string): string[] | null {
  const key = getCacheKey(threadId, intentFilter);
  const entry = summaryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.bullets;
  }
  // Clean up expired entry
  if (entry) {
    summaryCache.delete(key);
  }
  return null;
}

function setCachedSummary(threadId: string, intentFilter: string, bullets: string[]): void {
  const key = getCacheKey(threadId, intentFilter);
  summaryCache.set(key, { bullets, timestamp: Date.now() });
}

interface SummaryPanelProps {
  threadId: string;
  intentFilter: string;
  onClose: () => void;
}

export function SummaryPanel({
  threadId,
  intentFilter,
  onClose,
}: SummaryPanelProps) {
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef<string | null>(null);

  const loadSummary = useCallback(async () => {
    const cacheKey = getCacheKey(threadId, intentFilter);

    // Skip if already loading/loaded this exact combination
    if (loadedRef.current === cacheKey && !loading) {
      return;
    }

    // Check cache first
    const cached = getCachedSummary(threadId, intentFilter);
    if (cached) {
      setBullets(cached);
      setLoading(false);
      setError(null);
      loadedRef.current = cacheKey;
      return;
    }

    setLoading(true);
    setError(null);
    loadedRef.current = cacheKey;

    try {
      const result = await getThreadSummary(threadId, intentFilter);
      setBullets(result.bullets);
      setCachedSummary(threadId, intentFilter, result.bullets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
      setBullets([]);
    } finally {
      setLoading(false);
    }
  }, [threadId, intentFilter, loading]);

  useEffect(() => {
    loadSummary();
  }, [threadId, intentFilter]); // Intentionally not including loadSummary to control when it runs

  const handleRefresh = () => {
    // Clear cache and reload
    const key = getCacheKey(threadId, intentFilter);
    summaryCache.delete(key);
    loadedRef.current = null;
    loadSummary();
  };

  return (
    <div className="w-[400px] border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Summary
          </h2>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
            {intentFilter}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm disabled:opacity-50"
            title="Refresh summary"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xl leading-none px-2"
            aria-label="Close summary"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Generating summary...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
            <button
              onClick={handleRefresh}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : bullets.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
            No summary available
          </p>
        ) : (
          <ul className="space-y-3">
            {bullets.map((bullet, index) => (
              <li
                key={index}
                className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-200"
              >
                <span className="text-blue-600 dark:text-blue-400 shrink-0">
                  &bull;
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Based on recent {intentFilter === "All" ? "messages" : `${intentFilter} messages`}
        </p>
      </div>
    </div>
  );
}
