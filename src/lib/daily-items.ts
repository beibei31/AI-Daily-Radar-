import { getShanghaiDayBounds } from "@/src/lib/date";
import { logger } from "@/src/lib/logger";
import { mockDailyItems } from "@/src/lib/mock-data";
import {
  getSupabaseReadClient,
  hasSupabaseReadEnv
} from "@/src/lib/supabase";
import type { DailyItem } from "@/src/types/daily-item";

export type DailyReport = {
  date: Date;
  isFallback: boolean;
  items: DailyItem[];
};

export async function getDailyReport(date = new Date()): Promise<DailyReport> {
  const bounds = getShanghaiDayBounds(date);

  if (!hasSupabaseReadEnv()) {
    return {
      date,
      isFallback: true,
      items: mockDailyItems
    };
  }

  try {
    const supabase = getSupabaseReadClient();
    const { data, error } = await supabase
      .from("daily_items")
      .select("*")
      .gte("created_at", bounds.start.toISOString())
      .lt("created_at", bounds.end.toISOString())
      .order("score", { ascending: false })
      .limit(40);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        date,
        isFallback: true,
        items: mockDailyItems
      };
    }

    return {
      date,
      isFallback: false,
      items: data as DailyItem[]
    };
  } catch (error) {
    logger.warn("Falling back to mock daily items.", {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      date,
      isFallback: true,
      items: mockDailyItems
    };
  }
}

