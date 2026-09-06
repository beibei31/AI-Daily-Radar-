import { loadEnvConfig } from "@next/env";
import { getExplorationReport } from "@/src/lib/daily-items";
import { generateCuriosityItems } from "@/src/pipeline/curiosity";
import { saveCuriosityToSupabase } from "@/src/pipeline/save";

loadEnvConfig(process.cwd());
async function refresh() {
  const archive = await getExplorationReport();
  if (archive.status === "error" || archive.status === "missing_env")
    throw new Error("Exploration archive is unavailable.");
  const questions = await generateCuriosityItems(archive.items);
  if (!questions.length)
    throw new Error(
      "No new questions generated. Check source connectivity and LLM configuration.",
    );
  console.log(await saveCuriosityToSupabase(questions));
}
refresh().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Exploration refresh failed.",
  );
  process.exitCode = 1;
});
