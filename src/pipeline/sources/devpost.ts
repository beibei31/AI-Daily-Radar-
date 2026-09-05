import type { RawSourceItem, SourceAdapter } from "@/src/pipeline/types";
import { fetchWithRetry } from "@/src/pipeline/http";

type DevpostResponse = {
  hackathons?: Array<{
    displayed_location?: {
      location?: string;
    };
    end_a_submission_at?: string;
    id: number;
    open_state?: string;
    prize_amount?: string;
    submission_period_dates?: string;
    tagline?: string;
    themes?: Array<{ name: string }>;
    title: string;
    url: string;
  }>;
};

export class DevpostSourceAdapter implements SourceAdapter {
  id = "devpost";
  label = "Devpost";

  async fetchItems(): Promise<RawSourceItem[]> {
    const url = new URL("https://devpost.com/api/hackathons");
    url.searchParams.append("challenge_type[]", "online");
    url.searchParams.append("open_to[]", "public");
    url.searchParams.append("status[]", "open");
    url.searchParams.append("status[]", "upcoming");
    url.searchParams.set("order_by", "prize-amount");
    url.searchParams.set("page", "1");

    const response = await fetchWithRetry(url, {
      headers: {
        accept: "application/json",
        "user-agent": "AI Daily Radar/0.1"
      }
    });

    if (!response.ok) {
      throw new Error(`Devpost request failed: ${response.status}`);
    }

    const body = await response.text();

    if (!body.trim()) {
      throw new Error("Devpost returned an empty response body.");
    }

    const data = JSON.parse(body) as DevpostResponse;

    return (data.hackathons ?? []).slice(0, 12).map((hackathon) => ({
      categoryHint: "hackathon",
      id: `${this.id}:${hackathon.id}`,
      metadata: {
        location: hackathon.displayed_location?.location,
        prize: hackathon.prize_amount,
        state: hackathon.open_state,
        submissionPeriod: hackathon.submission_period_dates
      },
      publishedAt: hackathon.end_a_submission_at ?? null,
      source: this.label,
      summary: [
        hackathon.tagline,
        hackathon.prize_amount ? `Prize: ${hackathon.prize_amount}` : null,
        hackathon.submission_period_dates
      ]
        .filter(Boolean)
        .join(" "),
      tags: hackathon.themes?.map((theme) => theme.name) ?? [],
      title: hackathon.title,
      url: hackathon.url
    }));
  }
}
