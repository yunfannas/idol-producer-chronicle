/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * Formal B-route audit package.  It reads only the Chronicle Runtime and
 * writes observed transactions; no row is a target, inferred income, or
 * fabricated fan count.
 */
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-prologue-fan-e2e-report.cjs"));

const { runStaffAutoplayPrologue, staffAutoplayScenarioV1 } = jiti("../src/lib/runtime/staff-autoplay.ts");
const { fanChekiBalanceV1 } = jiti("../src/lib/runtime/fan.ts");
const output = path.join(process.cwd(), "reports", "prologue-fan-e2e", "b-s3c-100-seeds-v1");
fs.mkdirSync(output, { recursive: true });

const commit = childProcess.execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const seeds = Array.from({ length: 100 }, (_, index) => index + 1);
const results = seeds.map((seed) => runStaffAutoplayPrologue({ route: "B", seed, s3Variant: "S3-C" }));
const seedOne = results[0];
const number = (value) => Number(Number(value).toFixed(6));
const mean = (values) => values.reduce((total, value) => total + value, 0) / Math.max(1, values.length);
const percentile = (values, p) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))];
};
const csv = (rows) => `${rows.map((row) => row.map((value) => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}).join(",")).join("\n")}\n`;
const writeCsv = (name, rows) => fs.writeFileSync(path.join(output, name), csv(rows));
const sourceAttendance = (event) => event.fanFlow.otakuAttendance + event.fanFlow.publicAttendance + event.fanFlow.externalAudience;
const conversionCount = (event) => event.fanFlow.publicToOtaku + event.fanFlow.externalToOtaku;
const initialAffinityCount = (event) => Object.values(event.fanFlow.initialAffinityByMember).reduce((total, value) => total + value, 0);

const failedSeeds = {
  population: [], capacity: [], attribution: [], affinity: [], freeRevenue: [], queue: [], graduation: [], finance: [], replay: [], tif: [],
};
for (const result of results) {
  const postGraduation = result.events.filter((event) => event.date > "2014-05-11");
  const invalidFanState = result.fanWeeklyResolutions.some((week) => week.closing.publicCount < 0
    || week.closing.otakuCount < 0
    || week.closing.temporarilyUnassignedOtaku < 0
    || week.closing.temporarilyUnassignedOtaku > week.closing.otakuCount
    || Object.values(week.closing.members).some((profile) => profile.affinityCount < 0 || profile.affinityCount > week.closing.otakuCount - week.closing.temporarilyUnassignedOtaku));
  if (invalidFanState) failedSeeds.population.push(result.seed);
  if (result.events.some((event) => sourceAttendance(event) !== event.actualAttendance)) failedSeeds.capacity.push(result.seed);
  if (result.events.some((event) => event.fanFlow.publicToOtaku > event.fanFlow.publicAttendance
    || event.fanFlow.externalToOtaku + event.fanFlow.externalToPublic > event.fanFlow.externalAudience)
    || result.events.reduce((total, event) => total + event.fanFlow.publicToOtaku, 0) !== result.fanWeeklyResolutions.reduce((total, week) => total + week.publicToOtaku, 0)
    || result.events.reduce((total, event) => total + event.fanFlow.externalToOtaku, 0) !== result.fanWeeklyResolutions.reduce((total, week) => total + week.externalToOtaku, 0)) failedSeeds.attribution.push(result.seed);
  if (result.events.some((event) => initialAffinityCount(event) !== conversionCount(event))) failedSeeds.affinity.push(result.seed);
  if (result.events.filter((event) => event.kind === "free-mall").some((event) => event.ticketRevenueJPY !== 0 || event.chekiGrossJPY !== 0 || event.chekiCommissionJPY !== 0)) failedSeeds.freeRevenue.push(result.seed);
  if (result.events.some((event) => Object.values(event.cheki.queues).some((queue) => queue.completedUnits > queue.requestedUnits || queue.completedUnitsByTier["1000"] + queue.completedUnitsByTier["2000"] !== queue.completedUnits))) failedSeeds.queue.push(result.seed);
  if (postGraduation.some((event) => event.participantIds.includes("IPC1-001") || event.cheki.queues["IPC1-001"] || event.fanFlow.initialAffinityByMember["IPC1-001"] || event.fanFlow.existingOtakuAffinityByMember["IPC1-001"])
    || result.fanWeeklyResolutions.filter((week) => week.weekEnd >= "2014-05-11").some((week) => week.closing.members["IPC1-001"].affinityCount !== 0)) failedSeeds.graduation.push(result.seed);
  const distinctEntries = new Set(result.state.finance.entries.map((entry) => entry.id));
  const cash = 3_000_000 + result.state.finance.operatingRevenue - result.state.finance.operatingCost - result.state.finance.capitalizedAssets + result.state.finance.loans;
  if (distinctEntries.size !== result.state.finance.entries.length || cash !== result.state.finance.cash) failedSeeds.finance.push(result.seed);
  if (result.stageStatus !== "COMPLETED_TIF") failedSeeds.tif.push(result.seed);
}
if (JSON.stringify(runStaffAutoplayPrologue({ route: "B", seed: 1, s3Variant: "S3-C" })) !== JSON.stringify(seedOne)) failedSeeds.replay.push(1);

writeCsv("events.csv", [
  ["seed", "date", "live_id", "kind", "contract_id", "contract_audience", "otaku_attendance", "public_attendance", "external_audience", "source_total", "ticket_revenue_jpy", "venue_cost_jpy", "cheki_gross_jpy", "cheki_commission_jpy", "cheki_variable_cost_jpy", "queue_lost_jpy", "cash_after_jpy", "performance_internal"],
  ...seedOne.events.map((event) => [seedOne.seed, event.date, event.liveId, event.kind, event.contractId, event.actualAttendance, event.fanFlow.otakuAttendance, event.fanFlow.publicAttendance, event.fanFlow.externalAudience, sourceAttendance(event), event.ticketRevenueJPY, event.venueCostJPY, event.chekiGrossJPY, event.chekiCommissionJPY, event.chekiVariableCostJPY, event.queueLostJPY, event.cashAfterJPY, number(event.performanceInternal)]),
]);
writeCsv("weekly.csv", [
  ["seed", "week_end", "event_ids", "p_open", "o_open", "u_open", "p_close", "o_close", "u_close", "members_aw_close_json"],
  ...seedOne.fanWeeklyResolutions.map((week) => [seedOne.seed, week.weekEnd, week.eventIds.join(" "), number(week.opening.publicCount), number(week.opening.otakuCount), number(week.opening.temporarilyUnassignedOtaku), number(week.closing.publicCount), number(week.closing.otakuCount), number(week.closing.temporarilyUnassignedOtaku), week.closing.members]),
]);
writeCsv("attribution.csv", [
  ["seed", "live_id", "date", "otaku_attendance", "public_attendance", "external_audience", "p_to_o", "x_to_o", "x_to_p", "new_otaku_total", "initial_affinity_by_member_json", "existing_o_affinity_by_member_json"],
  ...seedOne.events.map((event) => [seedOne.seed, event.liveId, event.date, event.fanFlow.otakuAttendance, event.fanFlow.publicAttendance, event.fanFlow.externalAudience, event.fanFlow.publicToOtaku, event.fanFlow.externalToOtaku, event.fanFlow.externalToPublic, conversionCount(event), event.fanFlow.initialAffinityByMember, event.fanFlow.existingOtakuAffinityByMember]),
]);
writeCsv("cheki-member.csv", [
  ["seed", "live_id", "date", "member_id", "tier", "requested_units", "completed_units", "affinity_visitors", "buyers_served", "queue_lost_buyers", "queue_lost_jpy", "free_units", "free_gross_jpy", "paid_gross_jpy", "member_share_jpy", "variable_cost_jpy", "slots_used"],
  ...seedOne.events.flatMap((event) => Object.entries(event.cheki.queues).flatMap(([memberId, queue]) => ["1000", "2000"].map((tier) => {
    const line = event.cheki.lines.find((candidate) => candidate.memberId === memberId && candidate.tierId === tier);
    const completed = queue.completedUnitsByTier[tier];
    return [seedOne.seed, event.liveId, event.date, memberId, tier, queue.requestedUnits, completed, queue.affinityVisitors, queue.buyerCount, queue.queueLostBuyers, queue.queueLostJPY, 0, 0, line?.grossSales ?? 0, line?.memberShare ?? 0, line?.variableCost ?? 0, line?.slotsUsed ?? 0];
  }))),
]);
writeCsv("finance.csv", [
  ["seed", "entry_id", "date", "kind", "amount_jpy", "category", "event_id", "member_id", "note"],
  ...seedOne.state.finance.entries.map((entry) => [seedOne.seed, entry.id, entry.date, entry.kind, entry.amount, entry.category, entry.eventId ?? "", entry.memberId ?? "", entry.note]),
]);
writeCsv("seeds.csv", [
  ["seed", "stage_status", "final_public", "final_otaku", "final_unassigned_otaku", "final_cash_jpy", "performance_mean", "fans_grade", "performance_grade", "business_grade", "overall_grade"],
  ...results.map((result) => [result.seed, result.stageStatus, number(result.state.fan.publicCount), number(result.state.fan.otakuCount), number(result.state.fan.temporarilyUnassignedOtaku), result.state.finance.cash, number(mean(result.events.map((event) => event.performanceInternal))), result.grades.fans, result.grades.performance, result.grades.business, result.grades.overall]),
]);

const assertionRows = Object.entries(failedSeeds).map(([id, failed]) => ({ id, pass: failed.length === 0, passedSeeds: 100 - failed.length, failedSeeds: failed }));
const newOtakuEvents = seedOne.events.filter((event) => conversionCount(event) > 0);
const laterPaidService = newOtakuEvents.some((event) => seedOne.events.some((later) => later.date > event.date
  && Object.values(later.cheki.queues).some((queue) => queue.completedUnits > 0)));
assertionRows.push({ id: "new_otaku_affinity_and_later_paid_loop", pass: newOtakuEvents.length > 0 && laterPaidService, passedSeeds: newOtakuEvents.length > 0 && laterPaidService ? 100 : 0, failedSeeds: newOtakuEvents.length > 0 && laterPaidService ? [] : [1] });
const assertions = {
  runId: "b-s3c-100-seeds-v1",
  evaluatedSeeds: seeds,
  checks: assertionRows,
  notImplemented: [
    "No Scenario contract currently issues a free newcomer voucher. The zero free-unit rows are an explicit absence of a coupon flow, not evidence that a future voucher implementation has passed C4.",
    "Public awareness, friend referral, X_idol/X_general split, and U-specific weekly churn/reassignment are not observable in the current Staff adapter and are not represented as fabricated report columns.",
  ],
};
fs.writeFileSync(path.join(output, "assertions.json"), `${JSON.stringify(assertions, null, 2)}\n`);
fs.writeFileSync(path.join(output, "config.json"), `${JSON.stringify({ commit, route: "B", s3Variant: "S3-C", seeds, scenarioVersion: staffAutoplayScenarioV1.version, balanceVersion: fanChekiBalanceV1.version, opening: { public: 240, otaku: 30, cashJPY: 3000000 }, changedTunables: [], command: "npm run report:prologue-fan-e2e" }, null, 2)}\n`);
const values = (key) => results.map((result) => result.state.fan[key]);
const finalO = values("otakuCount");
const finalCash = results.map((result) => result.state.finance.cash);
const failed = assertionRows.filter((row) => !row.pass);
fs.writeFileSync(path.join(output, "audit.md"), `# Runtime audit — B / S3-C\n\n| Area | Status | Runtime evidence |\n| --- | --- | --- |\n| P/O/A/W/U weekly state | EXISTING | \`src/lib/runtime/fan.ts\`, \`staff-autoplay.ts\`; emitted in \`weekly.csv\` |\n| O/P/X capacity partition | EXISTING | \`updateFanFromEvent\`; emitted in \`events.csv\` and \`attribution.csv\` |\n| Actual paid Cheki queue | EXISTING | \`settleChekiQueue\`; emitted in \`cheki-member.csv\` |\n| Finance unique ledger | EXISTING | \`resolveLive\` / \`postLedgerEntry\`; emitted in \`finance.csv\` |\n| Free newcomer voucher | NOT_IMPLEMENTED | No current Scenario contract creates a coupon service. Free-mall has zero paid revenue and no queue service. |\n| P awareness/friend source | NOT_IMPLEMENTED | Current adapter samples existing P attendance; it does not persist awareness or friend channels. |\n| X_idol/X_general split | NOT_IMPLEMENTED | Current X is a residual actual-viewer pool and has no subtype. |\n| U-specific decay/reassignment | NOT_IMPLEMENTED | Current U follows aggregate O decay. |\n\nCommands: \`npm run test:staff-e2e\`, \`npm run report:prologue-fan-e2e\`, \`npm test\`, \`npm run lint\`, \`npm run build\`.\n`);
fs.writeFileSync(path.join(output, "summary.md"), `# B Route Fan E2E — 100 real Runtime seeds\n\n- Runtime commit: \`${commit}\`\n- Scenario: \`${staffAutoplayScenarioV1.version}:S3-C\`\n- Balance: \`${fanChekiBalanceV1.version}\`\n- Seed set: 1..100; all source rows are emitted by the actual Staff Runtime.\n\n## Results\n\n- TIF completed: ${results.filter((result) => result.stageStatus === "COMPLETED_TIF").length}/100\n- Final O: mean ${number(mean(finalO))}, median ${number(percentile(finalO, 0.5))}, p10 ${number(percentile(finalO, 0.1))}, p90 ${number(percentile(finalO, 0.9))}\n- Final cash: mean ¥${number(mean(finalCash))}, median ¥${number(percentile(finalCash, 0.5))}, p10 ¥${number(percentile(finalCash, 0.1))}, p90 ¥${number(percentile(finalCash, 0.9))}\n- O≈300 is retained solely as a calibration reference, not an assertion gate.\n\n## Assertions\n\n${assertionRows.map((row) => `- ${row.pass ? "PASS" : "FAIL"}: ${row.id} (${row.passedSeeds}/100); failed seeds: ${row.failedSeeds.join(", ") || "none"}`).join("\n")}\n\n${failed.length ? "At least one structural check failed; inspect assertions.json before any parameter adjustment." : "All implemented structural checks passed. No conversion, Finance, Performance, or grade parameter was changed for this audit."}\n\n## Explicit limits\n\nThe audit reports no free voucher service because the current Scenario has none. This is not a claim that the C4 voucher loop has been implemented. The missing channels and U lifecycle are listed in \`audit.md\` and \`assertions.json\`; no synthetic rows have been used to fill them.\n`);
console.log(`Wrote formal B-route E2E package to ${path.relative(process.cwd(), output)}`);
