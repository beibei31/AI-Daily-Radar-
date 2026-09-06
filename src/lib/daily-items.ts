import { getShanghaiDateKey } from "@/src/lib/date";
import { logger } from "@/src/lib/logger";
import { getSupabaseReadClient, hasSupabaseReadEnv } from "@/src/lib/supabase";
import type { CuriosityItem } from "@/src/types/curiosity-item";
import type { DailyItem } from "@/src/types/daily-item";
import { uniqueQuestions } from "@/src/lib/exploration";

export async function getExplorationReport(): Promise<DailyCuriosityReport> {
  if (!hasSupabaseReadEnv()) return { items: [], status: "missing_env" };
  try {
    const { data, error } = await getSupabaseReadClient()
      .from("curiosity_items")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(300);
    if (error) throw error;
    const items = uniqueQuestions((data ?? []) as CuriosityItem[]);
    return { items, status: items.length ? "ready" : "empty" };
  } catch {
    logger.warn("Failed to load exploration archive.");
    return { items: [], status: "error" };
  }
}

export type DailyReportStatus = "ready" | "empty" | "missing_env" | "error";

export type DailyReport = {
  date: Date;
  items: DailyItem[];
  status: DailyReportStatus;
};

export type DailyCuriosityReport = {
  items: CuriosityItem[];
  status: DailyReportStatus;
};

export async function getDailyReport(date = new Date()): Promise<DailyReport> {
  const reportDate = getShanghaiDateKey(date);

  if (!hasSupabaseReadEnv()) {
    return {
      date,
      items: [],
      status: "missing_env",
    };
  }

  try {
    const supabase = getSupabaseReadClient();
    const { data, error } = await supabase
      .from("daily_items")
      .select("*")
      .eq("report_date", reportDate)
      .order("score", { ascending: false })
      .limit(40);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        date,
        items: [],
        status: "empty",
      };
    }

    return {
      date,
      items: data as DailyItem[],
      status: "ready",
    };
  } catch (error) {
    logger.warn("Failed to load daily items.", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      date,
      items: [],
      status: "error",
    };
  }
}

export async function getDailyCuriosityReport(
  date = new Date(),
): Promise<DailyCuriosityReport> {
  const reportDate = getShanghaiDateKey(date);

  if (!hasSupabaseReadEnv()) {
    return {
      items: [],
      status: "missing_env",
    };
  }

  try {
    const supabase = getSupabaseReadClient();
    const { data, error } = await supabase
      .from("curiosity_items")
      .select("*")
      .eq("report_date", reportDate)
      .order("difficulty", { ascending: true })
      .limit(3);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        items: [],
        status: "empty",
      };
    }

    return {
      items: data as CuriosityItem[],
      status: "ready",
    };
  } catch (error) {
    logger.warn("Failed to load curiosity items.", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      items: [],
      status: "error",
    };
  }
}
