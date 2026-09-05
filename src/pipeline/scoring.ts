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
    category: decision.category,
    reason: decision.reason,
    score: clamp(Math.round(combined * 10), 1, 100),
    summary: decision.summary
  };
}

