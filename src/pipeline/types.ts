import type { Category } from "@/src/types/daily-item";

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
  importance: number;
  personal_score: number;
  summary: string;
  reason: string;
};

export type ScoredItem = NormalizedItem & {
  category: Category;
  score: number;
  summary: string;
  reason: string;
};

export type SourceAdapter = {
  id: string;
  label: string;
  fetchItems(): Promise<RawSourceItem[]>;
};

