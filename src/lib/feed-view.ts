import type { DailyItem } from "@/src/types/daily-item";

export type FeedFilter = "all" | "agent" | "coding" | "tool";
export type FeedSort = "score" | "newest";

export function filterFeed(
  items: DailyItem[],
  query: string,
  filter: FeedFilter,
  sort: FeedSort,
) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items
    .filter((item) => {
      const text = [item.title, item.source, item.summary, ...(item.tags ?? [])]
        .join(" ")
        .toLocaleLowerCase();
      const matches =
        filter === "all" ||
        (filter === "agent" && /agent|mcp|智能体/.test(text)) ||
        (filter === "coding" &&
          /coding|code|java|backend|编程|后端|开发/.test(text)) ||
        (filter === "tool" &&
          (item.category === "tool" || item.category === "try_today"));
      return matches && words.every((word) => text.includes(word));
    })
    .sort((a, b) =>
      sort === "score"
        ? (b.score ?? 0) - (a.score ?? 0)
        : timestamp(b) - timestamp(a),
    );
}

function timestamp(item: DailyItem) {
  const time = Date.parse(item.published_at ?? "");
  return Number.isFinite(time) ? time : 0;
}

export function safeImageUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
