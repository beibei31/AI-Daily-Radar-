export type Category =
  | "ai_news"
  | "tool"
  | "product"
  | "hackathon"
  | "try_today";

export type ContentType =
  | "news"
  | "tool"
  | "product"
  | "case_study"
  | "opportunity"
  | "engineering";

export type DailyItem = {
  id?: number;
  title: string;
  summary: string | null;
  reason: string | null;
  url: string | null;
  source: string | null;
  category: Category;
  score: number | null;
  report_date?: string | null;
  published_at: string | null;
  created_at?: string | null;
  tags?: string[] | null;
  content_type?: ContentType | string | null;
  what_happened?: string | null;
  why_it_matters?: string | null;
  action?: string | null;
  product_name?: string | null;
  product_one_liner?: string | null;
  target_user?: string | null;
  product_takeaways?: string[] | null;
  inspiration?: string | null;
  image_url?: string | null;
};
