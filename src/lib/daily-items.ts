import { getShanghaiDateKey } from "@/src/lib/date";
import { logger } from "@/src/lib/logger";
import {
  getSupabaseReadClient,
  hasSupabaseReadEnv
} from "@/src/lib/supabase";
import type { DailyItem } from "@/src/types/daily-item";

export type DailyReportStatus = "ready" | "empty" | "missing_env" | "error";

export type DailyReport = {
  date: Date;
  items: DailyItem[];
  status: DailyReportStatus;
};

export async function getDailyReport(date = new Date()): Promise<DailyReport> {
  const reportDate = getShanghaiDateKey(date);

  if (!hasSupabaseReadEnv()) {
    return {
      date,
      items: [],
      status: "missing_env"
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
        status: "empty"
      };
    }

    return {
      date,
      items: data as DailyItem[],
      status: "ready"
    };
  } catch (error) {
    logger.warn("Failed to load daily items.", {
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      date,
      items: [],
      status: "error"
    };
  }
}
