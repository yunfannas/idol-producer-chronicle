/* eslint-disable @typescript-eslint/no-require-imports */
/* Replays the repaired B fan-acquisition path; every row is simulation output. */
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-fan-acquisition-report.cjs"));

const { runStaffAutoplayPrologue, staffAutoplayScenarioV1 } = jiti("../src/lib/runtime/staff-autoplay.ts");
const output = path.join(process.cwd(), "reports", "staff-baseline", "fan-acquisition-v2");
fs.mkdirSync(output, { recursive: true });
const commit = childProcess.execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const number = (value) => Number(value.toFixed(6));
const csv = (rows) => `${rows.map((row) => row.map((value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}).join(",")).join("\n")}\n`;
const label = { debut: "debut", taiban: "taiban", "free-mall": "free-mall", "experimental-regular": "regular", regular: "regular", graduation: "graduation", "one-man": "one-man", festival: "TIF" };

const results = Array.from({ length: 100 }, (_, index) => runStaffAutoplayPrologue({ route: "B", seed: index + 1, s3Variant: "S3-C" }));
const resolutionTotal = (result, field) => result.fanWeeklyResolutions.reduce((sum, resolution) => sum + resolution[field], 0);
const activity = {};
for (const result of results) for (const event of result.events) {
  const key = label[event.kind] ?? event.kind;
  const row = activity[key] ??= { events: 0, audience: 0, otakuAttendance: 0, publicAttendance: 0, externalAudience: 0, publicToOtaku: 0, externalToOtaku: 0, externalToPublic: 0 };
  row.events += 1;
  row.audience += event.actualAttendance;
  row.otakuAttendance += event.fanFlow.otakuAttendance;
  row.publicAttendance += event.fanFlow.publicAttendance;
  row.externalAudience += event.fanFlow.externalAudience;
  row.publicToOtaku += event.fanFlow.publicToOtaku;
  row.externalToOtaku += event.fanFlow.externalToOtaku;
  row.externalToPublic += event.fanFlow.externalToPublic;
}

fs.writeFileSync(path.join(output, "b-100seed.csv"), csv([
  ["seed", "stage_status", "final_public", "final_otaku", "final_unassigned_otaku", "public_to_otaku", "external_to_otaku", "external_to_public", "final_cash_jpy", "performance_mean"],
  ...results.map((result) => [result.seed, result.stageStatus, number(result.state.fan.publicCount), number(result.state.fan.otakuCount), number(result.state.fan.temporarilyUnassignedOtaku), resolutionTotal(result, "publicToOtaku"), resolutionTotal(result, "externalToOtaku"), resolutionTotal(result, "externalToPublic"), result.state.finance.cash, number(mean(result.events.map((event) => event.performanceInternal)))]),
]));
fs.writeFileSync(path.join(output, "activity-acquisition.csv"), csv([
  ["activity", "events_per_route", "contract_audience", "otaku_attendance", "public_attendance", "external_audience", "public_to_otaku", "external_to_otaku", "external_to_public"],
  ...Object.entries(activity).map(([kind, row]) => [kind, number(row.events / 100), number(row.audience / 100), number(row.otakuAttendance / 100), number(row.publicAttendance / 100), number(row.externalAudience / 100), number(row.publicToOtaku / 100), number(row.externalToOtaku / 100), number(row.externalToPublic / 100)]),
]));
const seedOne = results[0];
fs.writeFileSync(path.join(output, "seed1-weekly-fan-resolution.csv"), csv([
  ["week_end", "event_ids", "public_to_otaku", "external_to_otaku", "external_to_public"],
  ...seedOne.fanWeeklyResolutions.map((resolution) => [resolution.weekEnd, resolution.eventIds.join(" "), resolution.publicToOtaku, resolution.externalToOtaku, resolution.externalToPublic]),
]));

const final = {
  completedTif: results.filter((result) => result.stageStatus === "COMPLETED_TIF").length,
  finalPublicMean: mean(results.map((result) => result.state.fan.publicCount)),
  finalOtakuMean: mean(results.map((result) => result.state.fan.otakuCount)),
  finalUnassignedOtakuMean: mean(results.map((result) => result.state.fan.temporarilyUnassignedOtaku)),
  publicToOtakuMean: mean(results.map((result) => resolutionTotal(result, "publicToOtaku"))),
  externalToOtakuMean: mean(results.map((result) => resolutionTotal(result, "externalToOtaku"))),
  externalToPublicMean: mean(results.map((result) => resolutionTotal(result, "externalToPublic"))),
  finalCashMeanJPY: mean(results.map((result) => result.state.finance.cash)),
  performanceMean: mean(results.map((result) => mean(result.events.map((event) => event.performanceInternal)))),
};
fs.writeFileSync(path.join(output, "summary.md"), `# Fan acquisition repair — B / S3-C / 100 seeds\n\n- Git SHA before this repair commit: \`${commit}\`\n- Scenario: \`${staffAutoplayScenarioV1.version}\`\n- Balance configuration: \`${staffAutoplayScenarioV1.tuningVersion}\`\n- Actual runs, no fixed revenue/fan/grade values:\n\n\`\`\`json\n${JSON.stringify(final, null, 2)}\n\`\`\`\n\n## Fixed data flow\n\n- Contract audience is now partitioned once into O, P and residual X; the three source counts never exceed contract attendance.\n- Event fan results are stored as momentum and resolved once per week. P→O uses the combined weekly hazard, while distinct X audience transitions remain event-attributed.\n- Saturday TIF momentum receives an explicit chapter-close resolution without an additional weekly churn pass.\n- P/O/A natural churn is reduced only through the named TUNABLE balance configuration; no Fan conversion, Performance, contract, Finance or grade threshold was raised.\n\n## Remaining boundary\n\n- Non-O Cheki trial and its combined Trial→O hazard are still not implemented in the Staff adapter. It remains a data-flow follow-up, not a substitute fixed-fan reward.\n- Graduation U currently follows the existing aggregate O decay path; the specification's separate U churn/reassignment process needs its own future lifecycle implementation rather than being folded into this acquisition/churn calibration.\n`);
console.log(`Wrote fan acquisition repair report to ${path.relative(process.cwd(), output)}`);
