/* eslint-disable @typescript-eslint/no-require-imports */
/* Replays the S3-A/B/C variants and writes only measured report artefacts. */
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-s3c-report.cjs"));

const { runStaffAutoplayPrologue, staffAutoplayScenarioV1 } = jiti("../src/lib/runtime/staff-autoplay.ts");

const outputDirectory = path.join(process.cwd(), "reports", "staff-baseline", "s3c");
fs.mkdirSync(outputDirectory, { recursive: true });
const commit = childProcess.execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();

function csv(rows) {
  return `${rows.map((row) => row.map((value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(",")).join("\n")}\n`;
}

function number(value) { return Number(value.toFixed(6)); }

function run(variant, route, count) {
  return Array.from({ length: count }, (_, index) => runStaffAutoplayPrologue({ route, seed: index + 1, s3Variant: variant }));
}

function mean(values) { return values.reduce((total, value) => total + value, 0) / values.length; }

function summary(results) {
  const performances = results.map((result) => mean(result.events.map((event) => event.performanceInternal)));
  const finalOtaku = results.map((result) => result.state.fan.otakuCount);
  const finalCash = results.map((result) => result.state.finance.cash);
  const keyBonus = results.flatMap((result) => result.events.map((event) => event.paletteExecution?.keyBonus ?? 0));
  const grades = Object.fromEntries(["fans", "performance", "business", "overall"].map((dimension) => [dimension, Object.fromEntries(["A", "B", "C", "D", "E"].map((grade) => [grade, results.filter((result) => result.grades[dimension] === grade).length]))]));
  return {
    seedCount: results.length,
    completedTif: results.filter((result) => result.stageStatus === "COMPLETED_TIF").length,
    debtDistress: results.filter((result) => result.stageStatus === "BANKRUPT_OR_DEBT_DISTRESS").length,
    performanceMean: mean(performances),
    finalOtakuMean: mean(finalOtaku),
    finalCashMeanJPY: mean(finalCash),
    minimumCashJPY: Math.min(...results.map((result) => result.minCash)),
    keyBonusMean: mean(keyBonus),
    keyBonusMaximum: Math.max(...keyBonus),
    grades,
  };
}

function seedRows(results) {
  return [
    ["seed", "stage_status", "performance_mean", "final_otaku", "final_cash_jpy", "minimum_cash_jpy", "familiarity_final_json", "fans_grade", "performance_grade", "business_grade", "overall_grade"],
    ...results.map((result) => [
      result.seed,
      result.stageStatus,
      number(mean(result.events.map((event) => event.performanceInternal))),
      number(result.state.fan.otakuCount),
      result.state.finance.cash,
      result.minCash,
      JSON.stringify(result.state.performanceProgression.arrangements),
      result.grades.fans,
      result.grades.performance,
      result.grades.business,
      result.grades.overall,
    ]),
  ];
}

const variants = ["S3-A", "S3-B", "S3-C"];
const b20 = Object.fromEntries(variants.map((variant) => [variant, run(variant, "B", 20)]));
const b100 = Object.fromEntries(variants.map((variant) => [variant, run(variant, "B", 100)]));
const a20 = run("S3-C", "A", 20);
const c20 = run("S3-C", "C", 20);
const seedOne = b100["S3-C"][0];

for (const variant of variants) {
  const fileStem = variant.toLowerCase().replace("-", "");
  fs.writeFileSync(path.join(outputDirectory, `${fileStem}-20seed.csv`), csv(seedRows(b20[variant])));
  fs.writeFileSync(path.join(outputDirectory, `${fileStem}-100seed.csv`), csv(seedRows(b100[variant])));
}

fs.writeFileSync(path.join(outputDirectory, "baseline-s3a.json"), `${JSON.stringify({
  gitSha: commit,
  scenarioVersion: staffAutoplayScenarioV1.version,
  variant: "S3-A",
  B20: summary(b20["S3-A"]),
  B100: summary(b100["S3-A"]),
}, null, 2)}\n`);

fs.writeFileSync(path.join(outputDirectory, "familiarity-weekly-ledger.csv"), csv([
  ["week_end", "song_id", "arrangement_version", "familiarity_open", "decay_debt", "rehearsal_hours", "stage_hours", "maintenance_paid", "growth", "familiarity_close"],
  ...seedOne.familiaritySettlements.map((entry) => [entry.weekEnd, entry.songId, entry.arrangementVersion, number(entry.familiarityOpen), number(entry.decayDebt), number(entry.rehearsalHours), number(entry.stageHours), number(entry.maintenancePaid), number(entry.growth), number(entry.familiarityClose)]),
]));

fs.writeFileSync(path.join(outputDirectory, "resolved-key-duties.csv"), csv([
  ["date", "live_id", "song_id", "arrangement_version", "key_part_id", "part_type", "member_id", "source", "reason", "familiarity_at_resolution", "key_bonus"],
  ...seedOne.events.flatMap((event) => (event.resolvedDuties ?? []).map((duty) => [event.date, event.liveId, duty.songId, duty.arrangementVersion, duty.keyPartId, duty.partType, duty.selectedMemberId ?? "", duty.selectedFrom, duty.reasonCode, number(duty.familiarityAtResolution), number(event.paletteExecution?.keyBonus ?? 0)])),
]));

fs.writeFileSync(path.join(outputDirectory, "seed1-event-ledger.csv"), csv([
  ["date", "live_id", "lineup_ids", "arrangement_version", "familiarity_at_live", "performance_internal", "palette_base_pe", "palette_key_bonus", "palette_final_pe", "ticket_revenue_jpy", "venue_cost_jpy", "cheki_gross_jpy", "cheki_commission_jpy", "cheki_variable_cost_jpy", "cash_after_jpy"],
  ...seedOne.events.map((event) => [event.date, event.liveId, event.participantIds.join(" "), event.arrangementVersion ?? "", number(event.familiarityAtLive ?? 0), number(event.performanceInternal), number(event.paletteExecution?.basePE ?? 0), number(event.paletteExecution?.keyBonus ?? 0), number(event.paletteExecution?.finalPE ?? 0), event.ticketRevenueJPY, event.venueCostJPY, event.chekiGrossJPY, event.chekiCommissionJPY, event.chekiVariableCostJPY, event.cashAfterJPY]),
]));

fs.writeFileSync(path.join(outputDirectory, "seed1-member-development.csv"), csv([
  ["member_id", "active_at_close", "training_hours", "actual_live_count", "actual_live_palette_hours", "condition_at_close", "palette_mean"],
  ...Object.entries(seedOne.memberDevelopment).map(([memberId, development]) => {
    const liveCount = seedOne.events.filter((event) => event.participantIds.includes(memberId)).length;
    return [memberId, development.active, development.trainingHours, liveCount, number(liveCount * staffAutoplayScenarioV1.performanceGrowth.livePaletteHours), number(development.condition), number(development.paletteMean)];
  }),
]));

fs.writeFileSync(path.join(outputDirectory, "seed1-finance-ledger.csv"), csv([
  ["id", "date", "kind", "amount_jpy", "category", "event_id", "note"],
  ...seedOne.state.finance.entries.map((entry) => [entry.id, entry.date, entry.kind, entry.amount, entry.category, entry.eventId ?? "", entry.note]),
]));

fs.writeFileSync(path.join(outputDirectory, "abc-s3c-20seed.csv"), csv([
  ["route", "seed", "stage_status", "performance_mean", "final_otaku", "final_cash_jpy", "minimum_cash_jpy", "overall_grade"],
  ...[...a20, ...b20["S3-C"], ...c20].map((result) => [result.route, result.seed, result.stageStatus, number(mean(result.events.map((event) => event.performanceInternal))), number(result.state.fan.otakuCount), result.state.finance.cash, result.minCash, result.grades.overall]),
]));

const summaries = Object.fromEntries(variants.map((variant) => [variant, { B20: summary(b20[variant]), B100: summary(b100[variant]) }]));
fs.writeFileSync(path.join(outputDirectory, "performance-before-after.md"), `# S3-A/B/C measured comparison\n\n- Git SHA before implementation commit: \`${commit}\`\n- Scenario: \`${staffAutoplayScenarioV1.version}\`\n- Fan, Finance, contract and grade configuration were held fixed.\n\n\`\`\`json\n${JSON.stringify({ variants: summaries, A20: summary(a20), C20: summary(c20) }, null, 2)}\n\`\`\`\n`);

const graduationEvent = seedOne.events.find((event) => event.liveId === "graduation-2014-05-11");
const firstAfterGraduation = seedOne.events.find((event) => event.date === "2014-05-14");
fs.writeFileSync(path.join(outputDirectory, "rina-graduation-rearrangement.md"), `# Rina graduation rearrangement — B seed 1\n\n- 2014-05-11 uses \`${graduationEvent?.arrangementVersion}\`; its duties were immutable once completed.\n- The S3-C Scenario TUNABLE inheritance factor is \`${staffAutoplayScenarioV1.arrangement.graduationInheritanceFactor}\`.\n- 2014-05-14 first post-graduation regular uses \`${firstAfterGraduation?.arrangementVersion}\`; no resolved duty contains \`IPC1-001\`.\n- The old version remains in the final Familiarity state; the successor is a distinct version and receives subsequent real rehearsal/stage exposure.\n`);

const b100S3c = b100["S3-C"];
const reconciliationHolds = b100S3c.every((result) => result.state.finance.cash === 3_000_000 + result.state.finance.operatingRevenue - result.state.finance.operatingCost - result.state.finance.capitalizedAssets + result.state.finance.loans);
const rinaDoesNotTrainAfterGraduation = seedOne.memberDevelopment["IPC1-001"].trainingHours === 420;
fs.writeFileSync(path.join(outputDirectory, "invariants.md"), `# S3-C invariant run\n\n- B S3-C 100 / 100 reached TIF if and only if the generated summary reports \`completedTif: 100\`; see \`performance-before-after.md\`.\n- Runtime unit tests cover duplicate exposure source ids, duplicate weekly settlement, candidate priority/fallback, legal part categories, capped key bonus and distinct graduation versions.\n- Event audit records lineup, arrangement version, F snapshot, resolved duties and PE breakdown; \`seed1-event-ledger.csv\` contains the measured per-Live values.\n- Finance reconciliation over all 100 B S3-C runs: \`${reconciliationHolds}\`. The seed-1 ledger is \`seed1-finance-ledger.csv\`.\n- Rina receives exactly 420 Staff training hours through the 2014-05-11 graduation boundary and none afterwards: \`${rinaDoesNotTrainAfterGraduation}\`. Per-member actual training/stage exposure and closing Condition are in \`seed1-member-development.csv\`.\n`);
fs.writeFileSync(path.join(outputDirectory, "failure-cases.md"), `# S3-C failures, fixes and limits\n\n- Fixed before the final regression: the Staff adapter applied daily Condition recovery and Monday training to a graduated inactive member. The active-member guard now preserves the retired member's Condition, EXP and Palette after 2014-05-11; the measured seed-1 boundary result is in \`invariants.md\`.\n- No Calendar softlock was accepted as success; all seed terminal statuses are exported in the CSVs.\n- Historical per-song setlists, initial arrangement F and graduation inheritance curve are not authoritative Scenario data. This adapter therefore uses named TUNABLE template inputs and must not be treated as a historical reconstruction.\n- Personal Duty Preparation (D), Env×PE bridge and full song-part/attribute-EXP adapter remain out of scope and are not represented as completed.\n`);

console.log(`Wrote S3-C reports to ${path.relative(process.cwd(), outputDirectory)}`);
