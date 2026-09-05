import type { Category } from "@/src/types/daily-item";

export const categories: Category[] = [
  "ai_news",
  "tool",
  "product",
  "hackathon",
  "try_today"
];

export const categoryLabels: Record<Category, string> = {
  ai_news: "🤖 AI Radar",
  tool: "🛠 Cool Tools",
  product: "💡 Build",
  hackathon: "🏆 Opportunities",
  try_today: "🌱 Today Try"
};

export const sectionMeta: Array<{
  category: Exclude<Category, "try_today">;
  marker: string;
  limit: number;
}> = [
  { category: "ai_news", marker: "", limit: 6 },
  { category: "tool", marker: "tool", limit: 6 },
  { category: "hackathon", marker: "hackathon", limit: 4 },
  { category: "product", marker: "product", limit: 4 }
];

export function getCategoryLabel(category: Category) {
  return categoryLabels[category];
}

export function isCategory(value: string | null | undefined): value is Category {
  return Boolean(value && categories.includes(value as Category));
}
