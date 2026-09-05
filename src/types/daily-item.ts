export type Category =
  | "ai_news"
  | "tool"
  | "product"
  | "hackathon"
  | "try_today";

export type DailyItem = {
  id?: number;
  title: string;
  summary: string | null;
  reason: string | null;
  url: string | null;
  source: string | null;
  category: Category;
  score: number | null;
  published_at: string | null;
  created_at?: string | null;
};

