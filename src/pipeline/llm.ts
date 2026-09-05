import { isCategory } from "@/src/lib/categories";
import { logger } from "@/src/lib/logger";
import { personalPreferences, pipelineConfig } from "@/src/pipeline/config";
import { heuristicDecision } from "@/src/pipeline/heuristic";
import type { LlmDecision, NormalizedItem } from "@/src/pipeline/types";

type LlmResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type DecisionPayload = {
  id?: string;
  keep?: boolean;
  category?: string;
  importance?: number;
  personal_score?: number;
  summary?: string;
  reason?: string;
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function clampScore(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(number)) {
    return fallback;
  }

  return Math.max(1, Math.min(10, Math.round(number)));
}

function parseJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }

    throw new Error("LLM response did not contain JSON.");
  }
}

function normalizeDecision(item: NormalizedItem, payload: DecisionPayload): LlmDecision {
  const fallback = heuristicDecision(item);
  const category = isCategory(payload.category) ? payload.category : fallback.category;

  return {
    category,
    importance: clampScore(payload.importance, fallback.importance),
    keep: typeof payload.keep === "boolean" ? payload.keep : fallback.keep,
    personal_score: clampScore(payload.personal_score, fallback.personal_score),
    reason: payload.reason?.trim() || fallback.reason,
    summary: payload.summary?.trim() || fallback.summary
  };
}

async function callLlm(batch: NormalizedItem[]) {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const baseUrl = (process.env.LLM_API_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "deepseek-v4-flash";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    body: JSON.stringify({
      max_tokens: 1800,
      messages: [
        {
          content:
            "你是一个面向个人开发者的 Tech Radar 编辑。只保留真正有技术、产品、项目或机会价值的信息，降低融资新闻、企业宣传稿、标题党和转载内容权重。官方原始来源、技术文档、工程博客、GitHub release/changelog 优先；中文社区只作为二级发现源。必须返回 JSON，不要 Markdown。",
          role: "system"
        },
        {
          content: JSON.stringify({
            output_contract: {
              items: [
                {
                  category: "ai_news | tool | product | hackathon | try_today",
                  id: "candidate id",
                  importance: "1-10 integer",
                  keep: true,
                  personal_score: "1-10 integer",
                  reason: "为什么值得关注，中文一句话",
                  summary: "发生了什么，中文一句话"
                }
              ]
            },
            personal_preferences: personalPreferences,
            candidates: batch.map((item) => ({
              category_hint: item.categoryHint,
              id: item.id,
              metadata: item.metadata,
              published_at: item.publishedAt,
              source: item.source,
              summary: item.summary,
              tags: item.tags,
              title: item.title,
              url: item.canonicalUrl || item.url
            }))
          }),
          role: "user"
        }
      ],
      model,
      response_format: {
        type: "json_object"
      },
      temperature: 0.2
    }),
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as LlmResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM response was empty.");
  }

  return parseJson(content) as { items?: DecisionPayload[] };
}

export async function rankWithLlm(items: NormalizedItem[]) {
  const decisions = new Map<string, LlmDecision>();

  for (const batch of chunk(items, pipelineConfig.llmBatchSize)) {
    try {
      const result = await callLlm(batch);

      if (!result) {
        batch.forEach((item) => decisions.set(item.id, heuristicDecision(item)));
        continue;
      }

      batch.forEach((item) => {
        const payload = result.items?.find((decision) => decision.id === item.id);
        decisions.set(item.id, normalizeDecision(item, payload ?? {}));
      });
    } catch (error) {
      logger.warn("LLM batch failed; using heuristic fallback.", {
        error: error instanceof Error ? error.message : String(error)
      });
      batch.forEach((item) => decisions.set(item.id, heuristicDecision(item)));
    }
  }

  return decisions;
}
