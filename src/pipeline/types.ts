import type { Category, ContentType } from "@/src/types/daily-item";

export type RawSourceItem = {
  id: string;
  title: string;
  url: string | null;
  source: string;
  summary?: string | null;
  publishedAt?: string | null;
  categoryHint?: Category;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type NormalizedItem = {
  id: string;
  title: string;
  url: string | null;
  canonicalUrl: string | null;
  source: string;
  summary: string | null;
  publishedAt: string | null;
  categoryHint?: Category;
  tags: string[];
  metadata: Record<string, unknown>;
  dedupeKey: string;
};

export type LlmDecision = {
  keep: boolean;
  category: Category;
  content_type: ContentType;
  importance: number;
  personal_score: number;
  summary: string;
  reason: string;
  tags: string[];
  what_happened: string;
  why_it_matters: string;
  action: string;
  product_name?: string | null;
  product_one_liner?: string | null;
  target_user?: string | null;
  product_takeaways?: string[];
  inspiration?: string | null;
};

export type ScoredItem = NormalizedItem & {
  category: Category;
  content_type: ContentType;
  score: number;
  summary: string;
  reason: string;
  tags: string[];
  what_happened: string;
  why_it_matters: string;
  action: string;
  product_name?: string | null;
  product_one_liner?: string | null;
  target_user?: string | null;
  product_takeaways?: string[];
  inspiration?: string | null;
};

export type SourceAdapter = {
  id: string;
  label: string;
  fetchItems(): Promise<RawSourceItem[]>;
};
