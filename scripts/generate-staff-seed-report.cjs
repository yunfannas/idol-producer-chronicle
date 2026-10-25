/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * Replays the real Staff Calendar adapter and serializes the S1 founder-seed
 * evidence.  It deliberately does not tune any Fan, Performance, ticket or
 * Finance parameter.  Run with `npm run report:staff-seed` after the E2E test.
 */
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-staff-seed-report.cjs"));

const { runStaffAutoplayPrologue, staffAutoplayScenarioV1 } = jiti("../src/lib/runtime/staff-autoplay.ts");
const { prologueFounderFanSeedV1 } = jiti("../src/lib/runtime/prologue.ts");

const outputDirectory = path.join(process.cwd(), "reports", "staff-baseline", "next-calibration");
fs.mkdirSync(outputDirectory, { recursive: true });

function formatNumber(value) {
  return Number(value.toFixed(6));
}

function csv(rows) {
  return `${rows.map((row) => row.map((value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(",")).join("\n")}\n`;
}

function gradeDistribution(results, dimension) {
  return Object.fromEntries(["A", "B", "C", "D", "E"].map((grade) => [grade, results.filter((result) => result.grades[dimension] === grade).length]));
}

function summary(results) {
  const values = (selector) => results.map(selector).sort((left, right) => left - right);
  const mean = (selector) => results.reduce((total, result) => total + selector(result), 0) / results.length;
  const percentile = (selector, fraction) => values(selector)[Math.floor((results.length - 1) * fraction)];
  return {
    seedCount: results.length,
    completedTif: results.filter((result) => result.stageStatus === "COMPLETED_TIF").length,
    debtDistress: results.filter((result) => result.stageStatus === "BANKRUPT_OR_DEBT_DISTRESS").length,
    finalOtaku: { mean: mean((result) => result.state.fan.otakuCount), p10: percentile((result) => result.state.fan.otakuCount, 0.1), p50: percentile((result) => result.state.fan.otakuCount, 0.5), p90: percentile((result) => result.state.fan.otakuCount, 0.9) },
    finalPublicMean: mean((result) => result.state.fan.publicCount),
    finalCash: { mean: mean((result) => result.state.finance.cash), p10: percentile((result) => result.state.finance.cash, 0.1), p50: percentile((result) => result.state.finance.cash, 0.5), p90: percentile((result) => result.state.finance.cash, 0.9) },
    globalMinimumCash: Math.min(...results.map((result) => result.minCash)),
    chekiGross: { mean: mean((result) => result.events.reduce((total, event) => total + event.chekiGrossJPY, 0)), positiveRuns: results.filter((result) => result.events.some((event) => event.chekiGrossJPY > 0)).length },
    grades: Object.fromEntries(["fans", "performance", "business", "overall"].map((dimension) => [dimension, gradeDistribution(results, dimension)])),
  };
}

const b100 = Array.from({ length: 100 }, (_, index) => runStaffAutoplayPrologue({ route: "B", seed: index + 1 }));
const a20 = Array.from({ length: 20 }, (_, index) => runStaffAutoplayPrologue({ route: "A", seed: index + 1 }));
const c20 = Array.from({ length: 20 }, (_, index) => runStaffAutoplayPrologue({ route: "C", seed: index + 1 }));
const seedOne = b100[0];

fs.writeFileSync(path.join(outputDirectory, "seed-only-100.csv"), csv([
  ["seed", "stage_status", "final_public", "final_otaku", "final_unassigned", "final_cash_jpy", "minimum_cash_jpy", "cheki_gross_jpy", "fans_grade", "performance_grade", "business_grade", "overall_grade"],
  ...b100.map((result) => [result.seed, result.stageStatus, formatNumber(result.state.fan.publicCount), formatNumber(result.state.fan.otakuCount), formatNumber(result.state.fan.temporarilyUnassignedOtaku), result.state.finance.cash, result.minCash, result.events.reduce((total, event) => total + event.chekiGrossJPY, 0), result.grades.fans, result.grades.performance, result.grades.business, result.grades.overall]),
]));

fs.writeFileSync(path.join(outputDirectory, "fan-flow-audit.csv"), csv([
  ["month", "p_open", "o_open", "u_open", "p_close", "o_close", "u_close", "o_attend", "p_attend", "external_watchers", "p_to_o", "x_to_o", "x_to_p", "p_churn", "o_churn", "affinity_churn", "member_profiles_close_json"],
  ...seedOne.fanMonths.map((month) => [month.month, formatNumber(month.opening.publicCount), formatNumber(month.opening.otakuCount), formatNumber(month.opening.temporarilyUnassignedOtaku), formatNumber(month.closing.publicCount), formatNumber(month.closing.otakuCount), formatNumber(month.closing.temporarilyUnassignedOtaku), month.eventFlow.otakuAttendance, month.eventFlow.publicAttendance, month.eventFlow.externalAudience, month.eventFlow.publicToOtaku, month.eventFlow.externalToOtaku, month.eventFlow.externalToPublic, formatNumber(month.weeklyChurn.publicCount), formatNumber(month.weeklyChurn.otakuCount), formatNumber(month.weeklyChurn.affinityTotal), JSON.stringify(month.closing.members)]),
]));

fs.writeFileSync(path.join(outputDirectory, "exposure-by-event.csv"), csv([
  ["date", "event_id", "kind", "contract_id", "contract_kind_source", "external_watchers", "external_watcher_source", "o_open", "p_open", "o_attend", "p_attend", "performance_q", "p_to_o", "x_to_o", "x_to_p", "cheki_gross_jpy", "queue_lost_jpy"],
  ...seedOne.events.map((event) => [event.date, event.liveId, event.kind, event.contractId, "SCENARIO_PROVIDED_DATE_AND_KIND", event.fanFlow.externalAudience, "TUNABLE contractFor attendance sample; not a historical measured reach", formatNumber(event.fanFlow.opening.otakuCount), formatNumber(event.fanFlow.opening.publicCount), event.fanFlow.otakuAttendance, event.fanFlow.publicAttendance, formatNumber(event.performanceInternal), event.fanFlow.publicToOtaku, event.fanFlow.externalToOtaku, event.fanFlow.externalToPublic, event.chekiGrossJPY, event.queueLostJPY]),
]));

fs.writeFileSync(path.join(outputDirectory, "seed-1-fan-flow.json"), `${JSON.stringify({
  runId: seedOne.runId,
  scenarioVersion: seedOne.scenarioVersion,
  tuningVersion: seedOne.tuningVersion,
  founderSeedVersion: prologueFounderFanSeedV1.version,
  fanMonths: seedOne.fanMonths,
  events: seedOne.events.map((event) => ({
    date: event.date,
    eventId: event.liveId,
    contractId: event.contractId,
    fanFlow: event.fanFlow,
    chekiGrossJPY: event.chekiGrossJPY,
    queueLostJPY: event.queueLostJPY,
  })),
}, null, 2)}\n`);

fs.writeFileSync(path.join(outputDirectory, "seed-only-summary.json"), `${JSON.stringify({
  scenarioVersion: staffAutoplayScenarioV1.version,
  tuningVersion: staffAutoplayScenarioV1.tuningVersion,
  founderSeedVersion: prologueFounderFanSeedV1.version,
  B100: summary(b100),
  A20: summary(a20),
  C20: summary(c20),
}, null, 2)}\n`);

const businessMonths = Array.from({ length: 20 }, (_, index) => {
  const date = new Date("2013-01-01T00:00:00Z");
  date.setUTCMonth(date.getUTCMonth() + index);
  const month = date.toISOString().slice(0, 7);
  const entries = seedOne.state.finance.entries.filter((entry) => entry.date.startsWith(month));
  const categoryTotals = Object.fromEntries([...new Set(entries.map((entry) => entry.category))].sort().map((category) => [category, entries.filter((entry) => entry.category === category).reduce((total, entry) => total + entry.amount, 0)]));
  return {
    month,
    operatingRevenue: entries.filter((entry) => entry.kind === "operating_revenue").reduce((total, entry) => total + entry.amount, 0),
    operatingCost: entries.filter((entry) => entry.kind === "operating_cost").reduce((total, entry) => total + entry.amount, 0),
    capitalizedAssets: entries.filter((entry) => entry.kind === "capitalized_asset").reduce((total, entry) => total + entry.amount, 0),
    loans: entries.filter((entry) => entry.kind === "loan_proceeds").reduce((total, entry) => total + entry.amount, 0),
    categoryTotals,
  };
});
fs.writeFileSync(path.join(outputDirectory, "business-by-month.csv"), csv([
  ["month", "operating_revenue_jpy", "operating_cost_jpy", "capitalized_assets_jpy", "loan_proceeds_jpy", "category_totals_json"],
  ...businessMonths.map((month) => [month.month, month.operatingRevenue, month.operatingCost, month.capitalizedAssets, month.loans, JSON.stringify(month.categoryTotals)]),
]));

console.log(`Wrote founder-seed reports to ${path.relative(process.cwd(), outputDirectory)}`);
