import { recencyScore } from "@/src/pipeline/recency";
import type { LlmDecision, NormalizedItem, ScoredItem } from "@/src/pipeline/types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function toScoredItem(item: NormalizedItem, decision: LlmDecision): ScoredItem {
  const combined =
    decision.importance * 0.45 +
    decision.personal_score * 0.45 +
    recencyScore(item.publishedAt) * 0.1;

  return {
    ...item,
    action: decision.action,
    category: decision.category,
    content_type: decision.content_type,
    inspiration: decision.inspiration ?? null,
    product_name: decision.product_name ?? null,
    product_one_liner: decision.product_one_liner ?? null,
    product_takeaways: decision.product_takeaways ?? [],
    reason: decision.reason,
    score: clamp(Math.round(combined * 10), 1, 100),
    summary: decision.summary,
    tags: decision.tags.length > 0 ? decision.tags : item.tags,
    target_user: decision.target_user ?? null,
    what_happened: decision.what_happened,
    why_it_matters: decision.why_it_matters
  };
}
