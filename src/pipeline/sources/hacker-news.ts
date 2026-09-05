import type { RawSourceItem, SourceAdapter } from "@/src/pipeline/types";
import { fetchWithRetry } from "@/src/pipeline/http";

type HnResponse = {
  hits?: Array<{
    author: string;
    created_at: string;
    num_comments: number;
    objectID: string;
    points: number;
    story_text?: string | null;
    title: string;
    url?: string | null;
  }>;
};

const queries = ["AI agent", "AI coding", "MCP", "LLM developer tools"];

function sinceUnix(hours: number) {
  return Math.floor((Date.now() - hours * 60 * 60 * 1000) / 1000);
}

export class HackerNewsSourceAdapter implements SourceAdapter {
  id = "hacker-news";
  label = "Hacker News";

  async fetchItems(): Promise<RawSourceItem[]> {
    const results = await Promise.all(
      queries.map(async (query) => {
        const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
        url.searchParams.set("query", query);
        url.searchParams.set("tags", "story");
        url.searchParams.set("numericFilters", `created_at_i>${sinceUnix(72)},points>10`);
        url.searchParams.set("hitsPerPage", "12");

        const response = await fetchWithRetry(url, {
          headers: {
            "user-agent": "AI Daily Radar/0.1"
          }
        });

        if (!response.ok) {
          throw new Error(`Hacker News request failed: ${response.status}`);
        }

        return (await response.json()) as HnResponse;
      })
    );

    const seen = new Set<string>();
    return results
      .flatMap((result) => result.hits ?? [])
      .filter((hit) => {
        if (seen.has(hit.objectID)) {
          return false;
        }
        seen.add(hit.objectID);
        return true;
      })
      .slice(0, 18)
      .map((hit) => ({
        id: `${this.id}:${hit.objectID}`,
        metadata: {
          comments: hit.num_comments,
          points: hit.points
        },
        publishedAt: hit.created_at,
        source: this.label,
        summary: `HN points: ${hit.points}. Comments: ${hit.num_comments}. Author: ${hit.author}.`,
        tags: ["hacker-news"],
        title: hit.title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
      }));
  }
}
