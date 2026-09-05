import type { RawSourceItem, SourceAdapter } from "@/src/pipeline/types";
import { fetchWithRetry } from "@/src/pipeline/http";

type GitHubSearchResponse = {
  items?: Array<{
    description: string | null;
    full_name: string;
    html_url: string;
    language: string | null;
    pushed_at: string;
    stargazers_count: number;
    topics?: string[];
  }>;
};

const queries = [
  "topic:ai-agent",
  "topic:llm",
  "topic:mcp",
  "topic:ai-coding",
  "agentic-ai"
];

function sinceDate(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export class GitHubRepoSourceAdapter implements SourceAdapter {
  id = "github-repos";
  label = "GitHub";

  async fetchItems(): Promise<RawSourceItem[]> {
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      accept: "application/vnd.github+json",
      "user-agent": "AI Daily Radar/0.1"
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const results = await Promise.all(
      queries.map(async (query) => {
        const url = new URL("https://api.github.com/search/repositories");
        url.searchParams.set("q", `${query} pushed:>=${sinceDate(14)}`);
        url.searchParams.set("sort", "stars");
        url.searchParams.set("order", "desc");
        url.searchParams.set("per_page", "8");

        const response = await fetchWithRetry(url, { headers });

        if (!response.ok) {
          throw new Error(`GitHub search failed: ${response.status}`);
        }

        return (await response.json()) as GitHubSearchResponse;
      })
    );

    const seen = new Set<string>();
    return results
      .flatMap((result) => result.items ?? [])
      .filter((repo) => {
        if (seen.has(repo.html_url)) {
          return false;
        }
        seen.add(repo.html_url);
        return true;
      })
      .slice(0, 18)
      .map((repo) => ({
        categoryHint: "tool",
        id: `${this.id}:${repo.full_name}`,
        metadata: {
          language: repo.language,
          stars: repo.stargazers_count
        },
        publishedAt: repo.pushed_at,
        source: this.label,
        summary: `${repo.description ?? "No description"} Stars: ${repo.stargazers_count}. Language: ${repo.language ?? "n/a"}.`,
        tags: repo.topics ?? [],
        title: repo.full_name,
        url: repo.html_url
      }));
  }
}
