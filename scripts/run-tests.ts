import assert from "node:assert/strict";
import {
  nextExploration,
  questionKey,
  uniqueQuestions,
} from "@/src/lib/exploration";
import { validateCuriosityOutput } from "@/src/pipeline/curiosity-validation";
import { curiosityCatalog } from "@/src/lib/curiosity-data";
import { filterFeed, safeImageUrl } from "@/src/lib/feed-view";
import type { DailyItem } from "@/src/types/daily-item";
import { pickCuriosityItemsForDate } from "@/src/lib/curiosity-data";
import { getCuriosityTopicOptions } from "@/src/lib/curiosity-interactions";
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
    ...overrides,
  };
}

function testDedupeByCanonicalUrl() {
  const items = [
    item({ id: "a" }),
    item({ id: "b", title: "Different title for same URL" }),
  ];

  assert.equal(deduplicate(items).length, 1);
}

function testShanghaiReportDateKey() {
  assert.equal(
    getShanghaiDateKey(new Date("2026-09-05T16:30:00.000Z")),
    "2026-09-06",
  );
}

function testCuriosityDailySelection() {
  const selected = pickCuriosityItemsForDate(
    new Date("2026-09-05T00:00:00Z"),
    3,
  );
  const titles = new Set(selected.map((entry) => entry.title));

  assert.equal(selected.length, 3);
  assert.equal(titles.size, 3);
  selected.forEach((entry) => {
    assert.ok((entry.question || entry.title).length > 8);
    assert.ok(entry.source_url.startsWith("https://"));
    assert.ok(entry.key_fact.length > 8);
  });
}

function testCuriosityTopicOptionsAreUnique() {
  assert.deepEqual(
    getCuriosityTopicOptions(["磁偏角", "航海", "磁偏角", ""], "航海"),
    ["磁偏角", "航海"],
  );
}

function testHeuristicDecisionIncludesV11Fields() {
  const decision = heuristicDecision(
    item({
      summary:
        "A GitHub open source MCP server helps AI coding tools connect to local files.",
      tags: ["MCP"],
      title: "Open source MCP Agent coding tool",
    }),
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
      summary:
        "An AI product turns raw meeting notes into structured follow-up workflows.",
      tags: ["Product"],
      title: "Granola AI product workflow",
    }),
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
testCuriosityTopicOptionsAreUnique();
testHeuristicDecisionIncludesV11Fields();
testProductPatternFallback();

const feed: DailyItem[] = [
  {
    title: "Java MCP server",
    summary: "Backend Agent",
    source: "GitHub",
    tags: ["MCP"],
    category: "tool",
    score: 90,
    published_at: "2026-09-05T10:00:00Z",
    reason: null,
    url: null,
  },
  {
    title: "Model release",
    summary: "New model",
    source: "Lab",
    category: "ai_news",
    score: 65,
    published_at: "2026-09-06T10:00:00Z",
    reason: null,
    url: null,
  },
  {
    title: "No date",
    summary: null,
    source: null,
    category: "ai_news",
    score: null,
    published_at: null,
    reason: null,
    url: null,
  },
];
assert.deepEqual(filterFeed(feed, " github MCP ", "agent", "score"), [feed[0]]);
assert.deepEqual(filterFeed(feed, "", "coding", "score"), [feed[0]]);
assert.deepEqual(filterFeed(feed, "", "tool", "score"), [feed[0]]);
assert.deepEqual(filterFeed(feed, "unknown", "all", "score"), []);
assert.equal(filterFeed(feed, "", "all", "newest")[0], feed[1]);
assert.equal(feed[0].score, 90);
assert.equal(safeImageUrl("javascript:alert(1)"), null);
assert.equal(
  safeImageUrl("https://example.com/image.png"),
  "https://example.com/image.png",
);
console.log("All tests passed.");
const archive = curiosityCatalog.slice(0, 8);
const seen: string[] = [];
for (let n = 0; n < archive.length; n += 1) {
  const next = nextExploration(archive, seen, undefined, () => 0);
  assert.ok(next);
  assert.ok(!seen.includes(questionKey(next)));
  seen.push(questionKey(next));
}
assert.equal(nextExploration(archive, seen), null);
assert.equal(uniqueQuestions([...archive, ...archive]).length, archive.length);
assert.notEqual(
  nextExploration(archive, [], archive[0].category, () => 0)?.category,
  archive[0].category,
);
const source = {
  id: "verified-source",
  source: "NASA",
  url: "https://www.nasa.gov/example",
  title: "Source material",
};
const knowledge = {
  source_id: source.id,
  category: "astronomy",
  question: "为什么会有这个现象？",
  hook: "这是一条可验证的知识线索。",
  explanation: "这里只根据原始资料说明现象的原因。",
  key_fact: "理解原理并保留原始出处。",
  related_topics: ["科学"],
  difficulty: 2,
  source_url: "https://invented.example",
};
assert.equal(
  validateCuriosityOutput({ items: [knowledge] }, [source])[0].source_url,
  source.url,
);
assert.equal(
  validateCuriosityOutput(
    {
      items: [knowledge, { ...knowledge, question: "同一来源的另一个问题？" }],
    },
    [source],
  ).length,
  1,
);
assert.equal(
  validateCuriosityOutput(
    { items: [{ ...knowledge, source_id: "invented" }] },
    [source],
  ).length,
  0,
);
assert.equal(
  validateCuriosityOutput({ items: [{ ...knowledge, explanation: "" }] }, [
    source,
  ]).length,
  0,
);
console.log("Exploration archive and source validation tests passed.");
