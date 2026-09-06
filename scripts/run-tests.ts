import assert from "node:assert/strict";
import { pickCuriosityItemsForDate } from "@/src/lib/curiosity-data";
import { getShanghaiDateKey } from "@/src/lib/date";
import { deduplicate } from "@/src/pipeline/dedupe";
import { heuristicDecision } from "@/src/pipeline/heuristic";
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

function testShanghaiReportDateKey() {
  assert.equal(
    getShanghaiDateKey(new Date("2026-09-05T16:30:00.000Z")),
    "2026-09-06"
  );
}

function testCuriosityDailySelection() {
  const selected = pickCuriosityItemsForDate(new Date("2026-09-05T00:00:00Z"), 3);
  const titles = new Set(selected.map((entry) => entry.title));

  assert.equal(selected.length, 3);
  assert.equal(titles.size, 3);
  selected.forEach((entry) => {
    assert.ok((entry.question || entry.title).length > 8);
    assert.ok(entry.source_url.startsWith("https://"));
    assert.ok(entry.key_fact.length > 8);
  });
}

function testHeuristicDecisionIncludesV11Fields() {
  const decision = heuristicDecision(
    item({
      summary: "A GitHub open source MCP server helps AI coding tools connect to local files.",
      tags: ["MCP"],
      title: "Open source MCP Agent coding tool"
    })
  );

  assert.equal(decision.category, "tool");
  assert.equal(decision.content_type, "tool");
  assert.ok(decision.tags.includes("MCP"));
  assert.ok(decision.what_happened.length > 12);
  assert.ok(decision.why_it_matters.length > 12);
  assert.ok(decision.action.length > 12);
}

function testProductPatternFallback() {
  const decision = heuristicDecision(
    item({
      categoryHint: "product",
      summary: "An AI product turns raw meeting notes into structured follow-up workflows.",
      tags: ["Product"],
      title: "Granola AI product workflow"
    })
  );

  assert.equal(decision.category, "product");
  assert.equal(decision.content_type, "product");
  assert.ok(decision.product_name);
  assert.ok((decision.product_takeaways ?? []).length >= 3);
  assert.ok(decision.inspiration);
}

testDedupeByCanonicalUrl();
testShanghaiReportDateKey();
testCuriosityDailySelection();
testHeuristicDecisionIncludesV11Fields();
testProductPatternFallback();

console.log("All tests passed.");
