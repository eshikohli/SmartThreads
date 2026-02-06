const categoryColors: Record<string, string> = {
  Question: "bg-purple-100 text-purple-800",
  Update: "bg-blue-100 text-blue-800",
  Concern: "bg-red-100 text-red-800",
  Decision: "bg-green-100 text-green-800",
  FYI: "bg-gray-100 text-gray-800",
  Scheduling: "bg-orange-100 text-orange-800",
};

export function CategoryTag({ category }: { category: string }) {
  const colorClass = categoryColors[category] || categoryColors.FYI;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colorClass}`}>
      {category}
    </span>
  );
}
