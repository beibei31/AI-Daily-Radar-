import { logger } from "@/src/lib/logger";
import { getSupabaseWriteClient, hasSupabaseWriteEnv } from "@/src/lib/supabase";
import { getShanghaiDayBounds } from "@/src/lib/date";
import type { CuriosityItem } from "@/src/types/curiosity-item";
import type { ScoredItem } from "@/src/pipeline/types";

function toRow(item: ScoredItem) {
  const imageUrl =
    typeof item.metadata.image_url === "string" ? item.metadata.image_url : null;

  return {
    action: item.action,
    category: item.category,
    content_type: item.content_type,
    image_url: imageUrl,
    inspiration: item.inspiration ?? null,
    published_at: item.publishedAt,
    product_name: item.product_name ?? null,
    product_one_liner: item.product_one_liner ?? null,
    product_takeaways: item.product_takeaways ?? [],
    reason: item.reason,
    score: item.score,
    source: item.source,
    summary: item.summary,
    tags: item.tags,
    target_user: item.target_user ?? null,
    title: item.title,
    url: item.canonicalUrl || item.url,
    what_happened: item.what_happened,
    why_it_matters: item.why_it_matters
  };
}

export async function saveToSupabase(items: ScoredItem[]) {
  if (items.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  if (!hasSupabaseWriteEnv()) {
    logger.warn("Supabase write env missing; printing preview instead of inserting.", {
      preview: items.slice(0, 5).map(toRow)
    });
    return { inserted: 0, skipped: items.length };
  }

  const supabase = getSupabaseWriteClient();
  const urls = items
    .map((item) => item.canonicalUrl || item.url)
    .filter((url): url is string => Boolean(url));

  const existingUrls = new Set<string>();

  if (urls.length > 0) {
    const { data, error } = await supabase.from("daily_items").select("url").in("url", urls);

    if (error) {
      throw error;
    }

    data?.forEach((row) => {
      if (row.url) {
        existingUrls.add(row.url);
      }
    });
  }

  const rows = items
    .filter((item) => {
      const url = item.canonicalUrl || item.url;
      return !url || !existingUrls.has(url);
    })
    .map(toRow);

  if (rows.length === 0) {
    return { inserted: 0, skipped: items.length };
  }

  const { error } = await supabase.from("daily_items").insert(rows);

  if (error) {
    throw error;
  }

  return { inserted: rows.length, skipped: items.length - rows.length };
}

function toCuriosityRow(item: CuriosityItem) {
  return {
    category: item.category,
    difficulty: item.difficulty,
    explanation: item.explanation,
    hook: item.hook,
    key_fact: item.key_fact,
    next_question: item.next_question ?? null,
    question: item.question ?? item.title,
    related_topics: item.related_topics,
    source: item.source,
    source_url: item.source_url,
    title: item.title
  };
}

export async function saveCuriosityToSupabase(items: CuriosityItem[]) {
  if (items.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  if (!hasSupabaseWriteEnv()) {
    logger.warn("Supabase write env missing; printing curiosity preview instead of inserting.", {
      preview: items.map(toCuriosityRow)
    });
    return { inserted: 0, skipped: items.length };
  }

  const supabase = getSupabaseWriteClient();
  const bounds = getShanghaiDayBounds();
  const titles = items.map((item) => item.title);
  const { data, error } = await supabase
    .from("curiosity_items")
    .select("title")
    .gte("created_at", bounds.start.toISOString())
    .lt("created_at", bounds.end.toISOString())
    .in("title", titles);

  if (error) {
    throw error;
  }

  const existingTitles = new Set(data?.map((row) => row.title) ?? []);
  const rows = items
    .filter((item) => !existingTitles.has(item.title))
    .map(toCuriosityRow);

  if (rows.length === 0) {
    return { inserted: 0, skipped: items.length };
  }

  const { error: insertError } = await supabase.from("curiosity_items").insert(rows);

  if (insertError) {
    throw insertError;
  }

  return { inserted: rows.length, skipped: items.length - rows.length };
}
