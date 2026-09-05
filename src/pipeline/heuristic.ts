import { isCategory } from "@/src/lib/categories";
import type { LlmDecision, NormalizedItem } from "@/src/pipeline/types";

const boostKeywords = [
  "agent",
  "agents",
  "mcp",
  "model context protocol",
  "ai coding",
  "coding",
  "developer",
  "devtool",
  "open source",
  "github",
  "java",
  "backend",
  "hackathon",
  "competition",
  "challenge",
  "sdk",
  "api",
  "llm",
  "workflow",
  "automation"
];

const downrankKeywords = [
  "funding",
  "raises",
  "valuation",
  "sponsored",
  "press release",
  "partnership",
  "appoints",
  "融资",
  "估值",
  "战略合作",
  "震惊",
  "必看",
  "一文看懂",
  "转载",
  "转发"
];

function haystack(item: NormalizedItem) {
  return `${item.title} ${item.summary ?? ""} ${item.tags.join(" ")}`.toLowerCase();
}

function inferCategory(item: NormalizedItem): LlmDecision["category"] {
  if (item.categoryHint && isCategory(item.categoryHint)) {
    return item.categoryHint;
  }

  const text = haystack(item);

  if (/hackathon|competition|challenge|prize|devpost|event/.test(text)) {
    return "hackathon";
  }

  if (/github|open source|repo|sdk|framework|library|tool|server|mcp/.test(text)) {
    return "tool";
  }

  if (/product|startup|launched|app|workflow|template|idea/.test(text)) {
    return "product";
  }

  return "ai_news";
}

function sentence(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  const first = value.split(/(?<=[.!?。！？])\s+/)[0];
  return first.slice(0, 180);
}

export function heuristicDecision(item: NormalizedItem): LlmDecision {
  const text = haystack(item);
  const boosts = boostKeywords.filter((keyword) => text.includes(keyword));
  const penalties = downrankKeywords.filter((keyword) => text.includes(keyword));
  const secondarySourcePenalty = /infoq|oschina|掘金|csdn|转载/.test(
    `${item.source} ${text}`.toLowerCase()
  )
    ? 1
    : 0;
  const category = inferCategory(item);
  const base = category === "hackathon" || category === "tool" ? 6 : 5;
  const importance = Math.max(
    1,
    Math.min(10, base + Math.min(boosts.length, 4) - penalties.length - secondarySourcePenalty)
  );
  const personalScore = Math.max(
    1,
    Math.min(
      10,
      base +
        Math.min(boosts.length + (item.categoryHint ? 1 : 0), 5) -
        penalties.length * 2 -
        secondarySourcePenalty
    )
  );

  return {
    category,
    importance,
    keep: importance >= 5 && personalScore >= 5,
    personal_score: personalScore,
    reason:
      boosts.length > 0
        ? `匹配个人偏好：${boosts.slice(0, 3).join(", ")}。`
        : "与 AI/开发者信息流相关，可作为低成本跟进候选。",
    summary: sentence(item.summary, item.title)
  };
}
