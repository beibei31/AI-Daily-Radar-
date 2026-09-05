import assert from "node:assert/strict";
import { pickCuriosityItemsForDate } from "@/src/lib/curiosity-data";
import { deduplicate } from "@/src/pipeline/dedupe";
import type { NormalizedItem } from "@/src/pipeline/types";

function item(overrides: Partial<NormalizedItem>): NormalizedItem {
  return {
    canonicalUrl: "https://example.com/post",
    dedupeKey: overrides.dedupeKey ?? "https://example.com/post",
    id: overrides.id ?? "item-1",
    metadata: {},
    publishedAt: "2026-09-05T00:00:00.000Z",
    source: "Test",
    summary: null,
    tags: [],
    title: "Test item",
    url: "https://example.com/post",
    ...overrides
  };
}

function testDedupeByCanonicalUrl() {
  const items = [
    item({ id: "a" }),
    item({ id: "b", title: "Different title for same URL" })
  ];

  assert.equal(deduplicate(items).length, 1);
}

function testCuriosityDailySelection() {
  const selected = pickCuriosityItemsForDate(new Date("2026-09-05T00:00:00Z"), 3);
  const titles = new Set(selected.map((entry) => entry.title));

  assert.equal(selected.length, 3);
  assert.equal(titles.size, 3);
  selected.forEach((entry) => {
    assert.ok(entry.source_url.startsWith("https://"));
    assert.ok(entry.key_fact.length > 8);
  });
}

testDedupeByCanonicalUrl();
testCuriosityDailySelection();

console.log("All tests passed.");

