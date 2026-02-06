const categoryColors: Record<string, string> = {
  Question: "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300",
  Update: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300",
  Concern: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300",
  Decision: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300",
  FYI: "bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300",
  Scheduling: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300",
};

export function CategoryTag({ category }: { category: string }) {
  const colorClass = categoryColors[category] || categoryColors.FYI;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colorClass}`}>
      {category}
    </span>
  );
}
