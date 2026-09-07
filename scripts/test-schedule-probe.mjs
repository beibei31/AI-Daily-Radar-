import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/daily-radar.yml", import.meta.url), "utf8");
assert.ok(workflow.includes('cron: "30 0 * * *"'), "Keep the normal daily schedule");
assert.ok(workflow.includes('cron: "7 3 7 9 *"'), "Register the dated probe");
assert.ok(workflow.includes("if: github.event_name != 'schedule' || github.event.schedule == '30 0 * * *'"), "Never run the paid pipeline for probe events");
const probe = workflow.split("  schedule-probe:\n")[1]?.split("  daily-radar:")[0];
assert.ok(probe);
assert.ok(probe.includes("github.event_name == 'schedule' && github.event.schedule == '7 3 7 9 *'"));
assert.ok(probe.includes('permissions: {}'));
assert.ok(probe.includes('"$(date -u +%F)" != "2026-09-07"'), "Expire the diagnostic step after today");
assert.ok(!/secrets\.|npm |uses:/.test(probe), "The probe must not load secrets, dependencies or application code");
console.log("PASS: daily schedule preserved; temporary probe isolated, dated and secret-free.");
