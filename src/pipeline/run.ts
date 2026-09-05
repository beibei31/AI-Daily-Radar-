import { logger } from "@/src/lib/logger";
import { pipelineConfig } from "@/src/pipeline/config";
import { generateCuriosityItems } from "@/src/pipeline/curiosity";
import { deduplicate } from "@/src/pipeline/dedupe";
import { normalizeItems } from "@/src/pipeline/normalize";
import { filterByRecency } from "@/src/pipeline/recency";
import { saveCuriosityToSupabase, saveToSupabase } from "@/src/pipeline/save";
import { toScoredItem } from "@/src/pipeline/scoring";
import { getSourceAdapters } from "@/src/pipeline/sources";
import type { RawSourceItem } from "@/src/pipeline/types";
import { rankWithLlm } from "@/src/pipeline/llm";

async function fetchSources() {
  const adapters = getSourceAdapters();
  const settled = await Promise.allSettled(
    adapters.map(async (adapter) => ({
      adapter: adapter.id,
      items: await adapter.fetchItems()
    }))
  );

  const items: RawSourceItem[] = [];
  const failures: Array<{ adapter: string; error: string }> = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(...result.value.items);
      logger.info("Fetched source.", {
        adapter: result.value.adapter,
        count: result.value.items.length
      });
    } else {
      failures.push({
        adapter: adapters[index]?.id ?? `adapter-${index}`,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      });
    }
  });

  failures.forEach((failure) => logger.warn("Source fetch failed.", failure));

  return { failures, items };
}

export async function runPipeline() {
  logger.info("Starting AI Daily Radar pipeline.");

  const sourceResult = await fetchSources();
  const normalized = normalizeItems(sourceResult.items);
  const deduped = deduplicate(normalized);
  const recent = filterByRecency(deduped, pipelineConfig.recencyHours).slice(
    0,
    pipelineConfig.maxCandidates
  );
  const decisions = await rankWithLlm(recent);

  const scored = recent
    .map((item) => {
      const decision = decisions.get(item.id);
      return decision?.keep ? toScoredItem(item, decision) : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.score >= pipelineConfig.minScoreToSave)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  const saved = await saveToSupabase(scored);
  const curiosity = generateCuriosityItems();
  const curiositySaved = await saveCuriosityToSupabase(curiosity);

  const result = {
    candidates: sourceResult.items.length,
    curiosity: {
      generated: curiosity.length,
      saved: curiositySaved
    },
    deduped: deduped.length,
    failures: sourceResult.failures,
    recent: recent.length,
    saved,
    selected: scored.length
  };

  logger.info("Finished AI Daily Radar pipeline.", result);
  return result;
}
