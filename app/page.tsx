import { DailyReportPage } from "@/src/components/DailyReportPage";
import {
  getDailyCuriosityReport,
  getExplorationReport,
  getDailyReport,
} from "@/src/lib/daily-items";

export const dynamic = "force-dynamic";

export default async function Home() {
  const date = new Date();
  const [dailyReport, curiosityReport, explorationReport] = await Promise.all([
    getDailyReport(date),
    getDailyCuriosityReport(date),
    getExplorationReport(),
  ]);

  return (
    <DailyReportPage
      initialExplorationItems={explorationReport.items}
      initialCuriosityItems={curiosityReport.items}
      initialCuriosityStatus={curiosityReport.status}
      initialDailyStatus={dailyReport.status}
      initialDate={dailyReport.date.toISOString()}
      initialItems={dailyReport.items}
    />
  );
}
