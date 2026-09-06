import { curiosityCategoryLabels } from "@/src/lib/curiosity-data";
import { uniqueQuestions } from "@/src/lib/exploration";
import type {
  CuriosityCategory,
  CuriosityItem,
} from "@/src/types/curiosity-item";
import type { RawSourceItem } from "@/src/pipeline/types";

export function validateCuriosityOutput(
  payload: unknown,
  sources: RawSourceItem[],
): CuriosityItem[] {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as { items?: unknown }).items)
  )
    return [];
  const output: CuriosityItem[] = [];
  const usedSources = new Set<string>();
  for (const raw of (payload as { items: unknown[] }).items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const source = sources.find((source) => source.id === item.source_id);
    if (
      !source?.url ||
      !/^https:\/\//.test(source.url) ||
      item.keep === false ||
      usedSources.has(source.url)
    )
      continue;
    if (
      typeof item.category !== "string" ||
      !Object.hasOwn(curiosityCategoryLabels, item.category)
    )
      continue;
    if (
      !["question", "hook", "explanation", "key_fact"].every(
        (key) =>
          typeof item[key] === "string" &&
          (item[key] as string).trim().length >= 6,
      )
    )
      continue;
    if (
      !Array.isArray(item.related_topics) ||
      !item.related_topics.every((topic) => typeof topic === "string")
    )
      continue;
    usedSources.add(source.url);
    output.push({
      title: (item.question as string).slice(0, 180),
      question: (item.question as string).slice(0, 180),
      category: item.category as CuriosityCategory,
      hook: (item.hook as string).slice(0, 300),
      explanation: (item.explanation as string).slice(0, 1800),
      key_fact: (item.key_fact as string).slice(0, 300),
      difficulty:
        typeof item.difficulty === "number" && Number.isFinite(item.difficulty)
          ? Math.max(1, Math.min(5, Math.round(item.difficulty)))
          : 2,
      related_topics: (item.related_topics as string[]).slice(0, 5),
      source: source.source,
      source_url: source.url,
      next_question:
        typeof item.next_question === "string"
          ? item.next_question.slice(0, 180)
          : null,
    });
  }
  return uniqueQuestions(output);
}
