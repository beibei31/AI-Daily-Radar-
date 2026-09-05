import type { NormalizedItem, RawSourceItem } from "@/src/pipeline/types";

const trackingParams = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "ref_src"
];

function cleanText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

export function canonicalizeUrl(url: string | null) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/$/, "");
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function titleKey(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function normalizeItems(items: RawSourceItem[]): NormalizedItem[] {
  return items
    .map((item) => {
      const title = cleanText(item.title);
      const canonicalUrl = canonicalizeUrl(item.url);

      return {
        canonicalUrl,
        categoryHint: item.categoryHint,
        dedupeKey: canonicalUrl || titleKey(title),
        id: item.id,
        metadata: item.metadata ?? {},
        publishedAt: parseDate(item.publishedAt),
        source: cleanText(item.source),
        summary: item.summary ? cleanText(item.summary).slice(0, 700) : null,
        tags: item.tags ?? [],
        title,
        url: item.url ? item.url.trim() : null
      };
    })
    .filter((item) => item.title.length > 4);
}
