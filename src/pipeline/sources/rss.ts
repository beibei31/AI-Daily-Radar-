import { XMLParser } from "fast-xml-parser";
import type { Category } from "@/src/types/daily-item";
import { fetchWithRetry } from "@/src/pipeline/http";
import type { RawSourceItem, SourceAdapter } from "@/src/pipeline/types";

type RssSourceOptions = {
  id: string;
  label: string;
  url: string;
  limit?: number;
  categoryHint?: Category;
  includeKeywords?: string[];
};

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  textNodeName: "#text"
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getText(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return getText(record["#text"]) || getText(record.__cdata);
  }

  return null;
}

function getLink(item: Record<string, unknown>) {
  const rawLink = item.link;

  if (typeof rawLink === "string") {
    return rawLink;
  }

  if (Array.isArray(rawLink)) {
    const alternate = rawLink.find((entry) => {
      return (
        entry &&
        typeof entry === "object" &&
        ((entry as Record<string, unknown>)["@_rel"] === "alternate" ||
          Boolean((entry as Record<string, unknown>)["@_href"]))
      );
    });
    return getLink({ link: alternate });
  }

  if (rawLink && typeof rawLink === "object") {
    const record = rawLink as Record<string, unknown>;
    return getText(record["@_href"]) || getText(record["#text"]);
  }

  return getText(item.guid) || null;
}

function stripHtml(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function richestText(values: unknown[]) {
  return values
    .map((value) => stripHtml(getText(value)))
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.length - left.length)[0] ?? null;
}

function containsKeyword(item: RawSourceItem, keywords: string[]) {
  if (keywords.length === 0) {
    return true;
  }

  const haystack = `${item.title} ${item.summary ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export class RssSourceAdapter implements SourceAdapter {
  id: string;
  label: string;
  private url: string;
  private limit: number;
  private categoryHint?: Category;
  private includeKeywords: string[];

  constructor(options: RssSourceOptions) {
    this.id = options.id;
    this.label = options.label;
    this.url = options.url;
    this.limit = options.limit ?? 12;
    this.categoryHint = options.categoryHint;
    this.includeKeywords = options.includeKeywords ?? [];
  }

  async fetchItems(): Promise<RawSourceItem[]> {
    const response = await fetchWithRetry(this.url, {
      headers: {
        "user-agent": "AI Daily Radar/0.1 (+https://vercel.app)"
      }
    });

    if (!response.ok) {
      throw new Error(`${this.label} RSS request failed: ${response.status}`);
    }

    const xml = await response.text();
    const parsed = parser.parse(xml);
    const channel = parsed.rss?.channel;
    const atomFeed = parsed.feed;

    if (!channel && !atomFeed) {
      throw new Error(`${this.label} response was not RSS/Atom.`);
    }

    const rawItems = asArray<Record<string, unknown>>(channel?.item || atomFeed?.entry);

    return rawItems
      .slice(0, this.limit * 2)
      .map((item, index) => {
        const title = stripHtml(getText(item.title)) || "Untitled";
        const summary = richestText([
          item.description,
          item.summary,
          item.content,
          item["content:encoded"],
        ]);
        const url = getLink(item);
        const publishedAt =
          getText(item.pubDate) ||
          getText(item.published) ||
          getText(item.updated) ||
          getText(item["dc:date"]);

        return {
          categoryHint: this.categoryHint,
          id: `${this.id}:${url || title}:${index}`,
          publishedAt,
          source: this.label,
          summary,
          tags: asArray(item.category).map((category) => getText(category)).filter(Boolean) as string[],
          title,
          url
        };
      })
      .filter((item) => item.title !== "Untitled")
      .filter((item) => containsKeyword(item, this.includeKeywords))
      .slice(0, this.limit);
  }
}
