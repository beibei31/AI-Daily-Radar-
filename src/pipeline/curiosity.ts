import { pickCuriosityItemsForDate } from "@/src/lib/curiosity-data";
import { pipelineConfig } from "@/src/pipeline/config";

export function generateCuriosityItems(date = new Date()) {
  return pickCuriosityItemsForDate(
    date,
    Math.max(1, Math.min(3, pipelineConfig.curiosityItemsPerDay))
  );
}
