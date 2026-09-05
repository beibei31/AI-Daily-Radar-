import type { Category } from "@/src/types/daily-item";

export const categories: Category[] = [
  "ai_news",
  "tool",
  "product",
  "hackathon",
  "try_today"
];

export const categoryLabels: Record<Category, string> = {
  ai_news: "🤖 Tech Radar",
  tool: "🤖 Tech Radar",
  product: "🧪 Product Patterns",
  hackathon: "🏆 Opportunities",
  try_today: "🤖 Tech Radar"
};

export const sectionMeta: Array<{
  category: Exclude<Category, "try_today">;
  marker: string;
  limit: number;
}> = [
  { category: "ai_news", marker: "", limit: 8 },
  { category: "tool", marker: "", limit: 8 },
  { category: "product", marker: "product", limit: 2 },
  { category: "hackathon", marker: "hackathon", limit: 3 }
];

export function getCategoryLabel(category: Category) {
  return categoryLabels[category];
}

export function isCategory(value: string | null | undefined): value is Category {
  return Boolean(value && categories.includes(value as Category));
}
