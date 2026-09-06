import { isCategory } from "@/src/lib/categories";
import { logger } from "@/src/lib/logger";
import { personalPreferences, pipelineConfig } from "@/src/pipeline/config";
import { heuristicDecision } from "@/src/pipeline/heuristic";
import type { LlmDecision, NormalizedItem } from "@/src/pipeline/types";
import type { ContentType } from "@/src/types/daily-item";

type LlmMessage = {
  content: string;
  role: "system" | "user";
};

type LlmResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
  }>;
  error?: {
    code?: string | number | null;
    message?: string | null;
    type?: string | null;
  };
};

type DecisionPayload = {
  id?: string;
  keep?: boolean;
  category?: string;
  content_type?: string;
  importance?: number;
  personal_score?: number;
  summary?: string;
  reason?: string;
  tags?: unknown;
  what_happened?: string;
  why_it_matters?: string;
  action?: string;
  product_name?: string;
  product_one_liner?: string;
  target_user?: string;
  product_takeaways?: unknown;
  inspiration?: string;
};

type JsonCompletionOptions = {
  purpose: "batch" | "smoke" | "curiosity";
  maxTokens: number;
  temperature?: number;
  buildMessages(attempt: number): LlmMessage[];
};

const maxLlmAttempts = 3;

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

function text(value: unknown, fallback: string, maxLength = 260) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

function stringArray(value: unknown, fallback: string[], maxItems = 5) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);

  return [...new Set(strings)].slice(0, maxItems);
}

function normalizeContentType(value: unknown, fallback: ContentType): ContentType {
  const allowed: ContentType[] = [
    "news",
    "tool",
    "product",
    "case_study",
    "opportunity",
    "engineering"
  ];

  return allowed.includes(value as ContentType) ? (value as ContentType) : fallback;
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
  const whatHappened = text(payload.what_happened, payload.summary || fallback.what_happened);
  const whyItMatters = text(payload.why_it_matters, payload.reason || fallback.why_it_matters);
  const action = text(payload.action, fallback.action);
  const isProduct = category === "product";

  return {
    category,
    content_type: normalizeContentType(payload.content_type, fallback.content_type),
    importance: clampScore(payload.importance, fallback.importance),
    keep: typeof payload.keep === "boolean" ? payload.keep : fallback.keep,
    personal_score: clampScore(payload.personal_score, fallback.personal_score),
    product_name: isProduct
      ? text(payload.product_name, fallback.product_name ?? "", 80) || null
      : null,
    product_one_liner: isProduct
      ? text(payload.product_one_liner, fallback.product_one_liner ?? whatHappened) || null
      : null,
    product_takeaways: isProduct
      ? stringArray(payload.product_takeaways, fallback.product_takeaways ?? [], 5)
      : [],
    inspiration: isProduct
      ? text(payload.inspiration, fallback.inspiration ?? "", 260) || null
      : null,
    reason: text(payload.reason, fallback.reason),
    summary: text(payload.summary, fallback.summary),
    tags: stringArray(payload.tags, fallback.tags, 5),
    target_user: isProduct
      ? text(payload.target_user, fallback.target_user ?? "", 120) || null
      : null,
    action,
    what_happened: whatHappened,
    why_it_matters: whyItMatters
  };
}

function getLlmCredentials() {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const baseUrl = (process.env.LLM_API_BASE_URL || "https://api.deepseek.com").replace(
    /\/$/,
    ""
  );
  const model = process.env.LLM_MODEL || "deepseek-v4-flash";

  return {
    apiKey,
    baseUrl,
    endpoint: `${baseUrl}/chat/completions`,
    model
  };
}

function isDeepSeekProvider(baseUrl: string, model: string) {
  return baseUrl.includes("deepseek.com") || model.toLowerCase().includes("deepseek");
}

function responseMeta(
  response: Response,
  data: LlmResponse | null,
  attempt: number,
  purpose: JsonCompletionOptions["purpose"],
  endpoint: string,
  model: string
) {
  const choice = data?.choices?.[0];
  const content = choice?.message?.content?.trim() ?? "";

  return {
    attempt,
    content_length: content.length,
    endpoint,
    finish_reason: choice?.finish_reason ?? null,
    has_choices: Boolean(data?.choices?.length),
    has_reasoning_content: Boolean(choice?.message?.reasoning_content),
    model,
    purpose,
    status: response.status
  };
}

function apiErrorMessage(rawBody: string, status: number) {
  try {
    const parsed = JSON.parse(rawBody) as LlmResponse;
    const message = parsed.error?.message || rawBody;
    return `LLM request failed: ${status} ${message}`.slice(0, 700);
  } catch {
    return `LLM request failed: ${status} ${rawBody}`.slice(0, 700);
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function requestJsonCompletion(options: JsonCompletionOptions) {
  const credentials = getLlmCredentials();

  if (!credentials) {
    return null;
  }

  for (let attempt = 1; attempt <= maxLlmAttempts; attempt += 1) {
    const response = await fetch(credentials.endpoint, {
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        max_tokens: options.maxTokens,
        messages: options.buildMessages(attempt),
        model: credentials.model,
        response_format: {
          type: "json_object"
        },
        stream: false,
        temperature: options.temperature ?? 0.2,
        ...(isDeepSeekProvider(credentials.baseUrl, credentials.model)
          ? {
              thinking: {
                type: "disabled"
              }
            }
          : {})
      }),
      headers: {
        authorization: `Bearer ${credentials.apiKey}`,
        "content-type": "application/json"
      },
      method: "POST"
    });

    const rawBody = await response.text();

    if (!response.ok) {
      throw new Error(apiErrorMessage(rawBody, response.status));
    }

    let data: LlmResponse | null = null;

    try {
      data = JSON.parse(rawBody) as LlmResponse;
    } catch {
      throw new Error("LLM returned non-JSON HTTP body.");
    }

    const meta = responseMeta(
      response,
      data,
      attempt,
      options.purpose,
      credentials.endpoint,
      credentials.model
    );
    logger.info("LLM response metadata.", meta);

    const content = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (content) {
      return parseJson(content);
    }

    if (attempt < maxLlmAttempts) {
      logger.warn("LLM response content was empty; retrying.", meta);
      await sleep(500 * 2 ** (attempt - 1));
    }
  }

  throw new Error(`LLM response was empty after ${maxLlmAttempts} attempts.`);
}

function buildBatchMessages(batch: NormalizedItem[], attempt: number): LlmMessage[] {
  const retryNote =
    attempt > 1
      ? "上一次返回了空内容。请简化输出，但必须返回一个有效 JSON object。"
      : "";

  return [
    {
      content: [
        "你是一个面向个人开发者的 Tech Radar 编辑。",
        "只保留真正有技术、产品、项目或机会价值的信息，降低融资新闻、企业宣传稿、标题党和转载内容权重。",
        "官方原始来源、技术文档、工程博客、GitHub release/changelog 优先；中文社区只作为二级发现源。",
        "必须返回 JSON object，不要 Markdown，不要解释。",
        retryNote
      ]
        .filter(Boolean)
        .join(" "),
      role: "system"
    },
    {
      content: JSON.stringify({
        instruction:
          "Return JSON only. The root JSON object must be {\"items\": [...]}.",
        json_example: {
          items: [
            {
              action: "今天可以实际尝试、记录或拆解什么",
              category: "tool",
              content_type: "tool",
              id: "candidate id",
              importance: 8,
              inspiration: "仅 product 类需要；个人开发者可以怎么切入",
              keep: true,
              personal_score: 9,
              product_name: "仅 product 类需要；产品名",
              product_one_liner: "仅 product 类需要；一句话说明做什么",
              product_takeaways: [
                "仅 product 类需要；交互 / 定位 / 技术实现 / 获客 / 定价等可偷师点"
              ],
              reason: "为什么值得关注，中文一句话",
              summary: "兼容旧字段，等同 what_happened",
              tags: ["Agent", "AI Coding", "MCP"],
              target_user: "仅 product 类需要；目标用户",
              what_happened: "发生了什么，中文一句话",
              why_it_matters: "为什么值得我看，对开发者或个人产品有什么意义"
            }
          ]
        },
        output_contract: {
          items: [
            {
              category: "ai_news | tool | product | hackathon | try_today",
              content_type:
                "news | tool | product | case_study | opportunity | engineering",
              id: "candidate id",
              importance: "1-10 integer",
              keep: true,
              personal_score: "1-10 integer",
              tags: ["最多 5 个短标签，例如 Agent, AI Coding, MCP, Product Pattern"],
              what_happened: "发生了什么，中文一句话",
              why_it_matters: "为什么值得我看，对开发者或个人产品有什么意义",
              action: "今天可以实际尝试、记录或拆解什么",
              reason: "为什么值得关注，中文一句话",
              summary: "兼容旧字段，等同 what_happened",
              product_name: "仅 product 类需要；产品名",
              product_one_liner: "仅 product 类需要；一句话说明做什么",
              target_user: "仅 product 类需要；目标用户",
              product_takeaways: [
                "仅 product 类需要；交互 / 定位 / 技术实现 / 获客 / 定价等可偷师点"
              ],
              inspiration: "仅 product 类需要；个人开发者可以怎么切入"
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
  ];
}

async function callLlm(batch: NormalizedItem[]) {
  const result = await requestJsonCompletion({
    buildMessages: (attempt) => buildBatchMessages(batch, attempt),
    maxTokens: 4000,
    purpose: "batch"
  });

  return result as { items?: DecisionPayload[] } | null;
}

export async function smokeTestLlmProvider() {
  const credentials = getLlmCredentials();

  if (!credentials) {
    throw new Error("LLM_API_KEY is missing.");
  }

  const result = await requestJsonCompletion({
    buildMessages: (attempt) => [
      {
        content:
          attempt > 1
            ? "Return JSON only. No Markdown. The response must be exactly a JSON object."
            : "You are a JSON smoke test. Return JSON only.",
        role: "system"
      },
      {
        content:
          "Return only this JSON object with no Markdown and no extra text: {\"ok\":true}",
        role: "user"
      }
    ],
    maxTokens: 300,
    purpose: "smoke",
    temperature: 0
  });

  if (!result || (result as { ok?: unknown }).ok !== true) {
    throw new Error("LLM smoke test did not return {\"ok\":true}.");
  }

  return {
    endpoint: credentials.endpoint,
    model: credentials.model,
    ok: true
  };
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
