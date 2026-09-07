import { isCategory } from "@/src/lib/categories";
import type { LlmDecision, NormalizedItem } from "@/src/pipeline/types";
import type { Category, ContentType } from "@/src/types/daily-item";

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

function inferContentType(category: Category, text: string): ContentType {
  if (category === "hackathon") {
    return "opportunity";
  }

  if (category === "product") {
    return "product";
  }

  if (category === "tool") {
    return "tool";
  }

  if (/engineering|architecture|backend|java|postgres|database|infra/.test(text)) {
    return "engineering";
  }

  return "news";
}

function sourceBrief(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.trim().slice(0, 900);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function inferTags(item: NormalizedItem, category: Category, boosts: string[]) {
  const text = haystack(item);
  const tags = [...item.tags];

  if (/agent|workflow|automation/.test(text)) {
    tags.push("Agent");
  }

  if (/coding|code|developer|devtool|sdk|api|github/.test(text)) {
    tags.push("Developer Tool");
  }

  if (/mcp|model context protocol/.test(text)) {
    tags.push("MCP");
  }

  if (/java|spring|backend|database|postgres|infra/.test(text)) {
    tags.push("Backend");
  }

  if (/open source|github|repo|release|changelog/.test(text)) {
    tags.push("Open Source");
  }

  if (category === "product") {
    tags.push("Product Pattern");
  }

  if (category === "hackathon") {
    tags.push("Opportunity");
  }

  boosts.slice(0, 2).forEach((keyword) => {
    if (keyword.length <= 18) {
      tags.push(keyword.replace(/\b\w/g, (letter) => letter.toUpperCase()));
    }
  });

  return unique(tags).slice(0, 5);
}

function actionForCategory(category: Category, item: NormalizedItem) {
  if (category === "hackathon") {
    return "看报名门槛、截止日期和作品要求，判断能否用一个周末做出可展示 Demo。";
  }

  if (category === "product") {
    return "拆解它的目标用户、首屏承诺和关键工作流，记录一个可以复用到个人项目的产品点。";
  }

  if (category === "tool") {
    return "打开 README 或官方文档，花 20 分钟跑通最小示例，判断是否能接入你的项目。";
  }

  if (item.tags.some((tag) => /mcp/i.test(tag))) {
    return "挑一个 MCP 场景，试着把本地文件、数据库或常用 SaaS 暴露给 AI Coding 工具。";
  }

  return "先读官方来源的变更点，再记录它对 Agent、AI Coding 或后端项目的一个具体影响。";
}

function fallbackContext(category: Category) {
  if (category === "hackathon") {
    return "自动详细解读暂不可用。可先依据上方来源摘要确认主题，再到活动页核对报名对象、截止时间、赛题和提交要求。";
  }

  if (category === "product") {
    return "自动详细解读暂不可用。可先依据上方来源摘要了解产品，再从目标用户、核心工作流和差异化价值三个角度判断是否值得借鉴。";
  }

  if (category === "tool") {
    return "自动详细解读暂不可用。可先依据上方来源摘要了解项目，再到官方文档核对安装方式、主要能力、兼容性和当前限制。";
  }

  return "自动详细解读暂不可用。上方内容来自抓取到的来源摘要；建议通过官方原文核对具体变更、适用范围和限制。";
}

function inferProductName(title: string) {
  return title
    .replace(/发布|上线|推出|受到关注|开放|新版本|工具|产品/g, "")
    .split(/[：:，,-]/)[0]
    .trim()
    .slice(0, 40);
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
  const contentType = inferContentType(category, text);
  const tags = inferTags(item, category, boosts);
  const whatHappened = sourceBrief(item.summary, item.title);
  const whyItMatters = fallbackContext(category);
  const action = actionForCategory(category, item);
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
    action,
    category,
    content_type: contentType,
    importance,
    inspiration:
      category === "product"
        ? "个人开发者可以从更窄的人群或更明确的数据源切入，先做一个高完成度的小工具。"
        : null,
    keep: importance >= 5 && personalScore >= 5,
    personal_score: personalScore,
    product_name: category === "product" ? inferProductName(item.title) : null,
    product_one_liner: category === "product" ? whatHappened : null,
    product_takeaways:
      category === "product"
        ? [
            "把复杂工作流压缩成一个清晰入口。",
            "首屏直接说明目标用户和可完成的任务。",
            "把 AI 能力包装成用户能立即验证的结果。"
          ]
        : [],
    reason: whyItMatters,
    summary: whatHappened,
    tags,
    target_user: category === "product" ? "开发者、独立开发者或小团队" : null,
    what_happened: whatHappened,
    why_it_matters: whyItMatters
  };
}
