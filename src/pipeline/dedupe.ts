import type { NormalizedItem } from "@/src/pipeline/types";

function titleTokens(title: string) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>) {
  const union = new Set([...a, ...b]);
  if (union.size === 0) {
    return 0;
  }

  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) {
      intersection += 1;
    }
  });

  return intersection / union.size;
}

export function deduplicate(items: NormalizedItem[]) {
  const exact = new Set<string>();
  const kept: NormalizedItem[] = [];

  for (const item of items) {
    if (exact.has(item.dedupeKey)) {
      continue;
    }

    const itemTokens = titleTokens(item.title);
    const hasNearDuplicate = kept.some((existing) => {
      return jaccard(itemTokens, titleTokens(existing.title)) > 0.82;
    });

    if (hasNearDuplicate) {
      continue;
    }

    exact.add(item.dedupeKey);
    kept.push(item);
  }

  return kept;
}

