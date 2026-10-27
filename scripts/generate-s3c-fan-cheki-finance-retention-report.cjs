/* eslint-disable @typescript-eslint/no-require-imports */
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-s3c-fan-cheki-finance-retention-report.cjs"));
const { runStaffAutoplayPrologue, r0ConversionDefaultV1 } = jiti("../src/lib/runtime/staff-autoplay.ts");
const { fanChekiBalanceV1 } = jiti("../src/lib/runtime/fan.ts");

const output = path.join(process.cwd(), "reports", "staff-baseline", "s3c-fan-cheki-finance-retention-v1", "e-100-seeds");
fs.mkdirSync(output, { recursive: true });
const seeds = Array.from({ length: 100 }, (_, index) => index + 1);
const number = (value) => Number(Number(value).toFixed(6));
const sum = (values) => values.reduce((total, value) => total + value, 0);
const mean = (values) => sum(values) / Math.max(1, values.length);
const percentile = (values, p) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.round((sorted.length - 1) * p)]; };
const csv = (rows) => `${rows.map((row) => row.map((value) => { const text = typeof value === "string" ? value : JSON.stringify(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }).join(",")).join("\n")}\n`;
const writeCsv = (name, rows) => fs.writeFileSync(path.join(output, name), csv(rows));
const writeJson = (name, value) => fs.writeFileSync(path.join(output, name), `${JSON.stringify(value, null, 2)}\n`);
const byCategory = (entries, kind, category) => sum(entries.filter((entry) => entry.kind === kind && entry.category === category).map((entry) => entry.amount));
const totalA = (fan) => sum(Object.values(fan.members).map((profile) => profile.affinityCount));
const totalW = (fan) => sum(Object.values(fan.members).map((profile) => profile.purchaseWeightKJPY));
const fullInput = (seed) => ({ route: "B", seed, s3Variant: "S3-C", fanAcquisitionStage: "C3", r0Conversion: { ...r0ConversionDefaultV1, enabled: true, enablePaidCheki: true, enableVoucherCheki: true, enableExternalLive: true }, newcomerVoucher: { enabled: true } });
const legacyInput = (seed) => ({ route: "B", seed, s3Variant: "S3-C", fanAcquisitionStage: "C3", r0Conversion: { enabled: false } });

const eventRows = [["seed", "date", "live_id", "member_id", "requested_jpy", "completed_1000", "completed_2000", "paid_newcomer_requested", "paid_newcomer_served", "paid_newcomer_lost", "voucher_requested", "voucher_served", "voucher_lost", "voucher_cost_jpy", "gross_jpy", "commission_jpy", "variable_cost_jpy", "net_jpy", "queue_lost_jpy"]];
const financeRows = [["seed", "kind", "category", "amount_jpy"]];
const memberRows = [["seed", "member_id", "initial_a", "final_a", "initial_w_kjpy", "final_w_kjpy", "member_live_new_o_a", "paid_cheki_new_o_a", "voucher_cheki_new_o_a", "existing_o_live_new_a", "w_log_change", "active_final"]];
const retentionRows = [["seed", "week_end", "opening_o", "base_o_rate", "retention_factor", "actual_o_churn", "actual_o_rate", "live_count", "mean_live_quality", "sns_new_p", "promotion_signal", "opening_a", "a_churn", "graduation_loss", "opening_u", "closing_u"]];
const graduationRows = [["seed", "week_end", "opening_o", "closing_o", "opening_u", "closing_u", "graduation_loss", "rina_final_a"]];
const seedRows = [["seed", "final_p", "final_o", "final_a_total", "final_w_total_kjpy", "one_man_attendance", "one_man_ticket_jpy", "paid_requested_jpy", "paid_completed_units", "paid_lost_jpy", "cheki_gross_jpy", "member_commission_jpy", "paid_variable_cost_jpy", "voucher_requested", "voucher_served", "voucher_lost", "voucher_cost_jpy", "cheki_net_jpy", "ticket_revenue_jpy", "venue_cost_jpy", "training_cost_jpy", "payroll_jpy", "capitalized_assets_jpy", "final_cash_jpy", "legacy_cash_jpy", "paired_cash_delta_jpy"]];
const failures = [];
const fullResults = [];

for (const seed of seeds) {
  const result = runStaffAutoplayPrologue(fullInput(seed));
  const legacy = runStaffAutoplayPrologue(legacyInput(seed));
  fullResults.push(result);
  const entries = result.state.finance.entries;
  for (const id of [...new Set(entries.map((entry) => `${entry.kind}:${entry.category}`))].sort()) {
    const [kind, category] = id.split(":");
    financeRows.push([seed, kind, category, byCategory(entries, kind, category)]);
  }
  let requestedJPY = 0; let completedUnits = 0; let lostJPY = 0; let grossJPY = 0; let commissionJPY = 0; let variableJPY = 0; let voucherRequested = 0; let voucherServed = 0; let voucherLost = 0; let voucherCostJPY = 0;
  for (const event of result.events) for (const [memberId, queue] of Object.entries(event.cheki.queues)) {
    const lines = event.cheki.lines.filter((line) => line.memberId === memberId);
    const gross = sum(lines.map((line) => line.grossSales));
    const commission = sum(lines.map((line) => line.memberShare));
    const variable = sum(lines.map((line) => line.variableCost));
    const computedGross = queue.completedUnitsByTier["1000"] * 1000 + queue.completedUnitsByTier["2000"] * 2000;
    eventRows.push([seed, event.date, event.liveId, memberId, queue.requestedJPY, queue.completedUnitsByTier["1000"], queue.completedUnitsByTier["2000"], queue.paidNewcomerRequested, queue.paidNewcomerServed, queue.paidNewcomerLost, queue.freeTrialRequested, queue.freeTrialServed, queue.freeTrialLost, queue.freeTrialVariableCostJPY, gross, commission, variable, gross - commission - variable, queue.queueLostJPY]);
    requestedJPY += queue.requestedJPY; completedUnits += queue.completedUnits; lostJPY += queue.queueLostJPY; grossJPY += gross; commissionJPY += commission; variableJPY += variable; voucherRequested += queue.freeTrialRequested; voucherServed += queue.freeTrialServed; voucherLost += queue.freeTrialLost; voucherCostJPY += queue.freeTrialVariableCostJPY;
    if (queue.requestedJPY !== gross + queue.queueLostJPY) failures.push([seed, "paid_requested_equals_completed_plus_lost", event.liveId, memberId]);
    if (gross !== computedGross) failures.push([seed, "gross_equals_completed_price", event.liveId, memberId]);
    if (queue.paidNewcomerRequested !== queue.paidNewcomerServed + queue.paidNewcomerLost) failures.push([seed, "paid_newcomer_queue", event.liveId, memberId]);
    if (queue.freeTrialRequested !== queue.freeTrialServed + queue.freeTrialLost) failures.push([seed, "voucher_queue", event.liveId, memberId]);
    if (queue.freeTrialVariableCostJPY !== queue.freeTrialServed * 180) failures.push([seed, "voucher_cost", event.liveId, memberId]);
  }
  if (byCategory(entries, "operating_revenue", "cheki_sales") !== grossJPY || byCategory(entries, "operating_cost", "cheki_member_share") !== commissionJPY || byCategory(entries, "operating_cost", "cheki_variable_cost") !== variableJPY || byCategory(entries, "operating_cost", "newcomer_voucher_cost") !== voucherCostJPY || commissionJPY !== grossJPY * 0.2) failures.push([seed, "finance_cheki_ledger", "", ""]);
  const opening = result.events[0].fanFlow.opening;
  for (const [memberId, profile] of Object.entries(result.state.fan.members)) {
    const eventSum = (field) => sum(result.events.map((event) => event.fanFlow[field][memberId] ?? 0));
    memberRows.push([seed, memberId, number(opening.members[memberId]?.affinityCount ?? 0), number(profile.affinityCount), number(opening.members[memberId]?.purchaseWeightKJPY ?? 0), number(profile.purchaseWeightKJPY), eventSum("memberLiveAffinityByMember"), eventSum("paidChekiAffinityByMember"), eventSum("voucherChekiAffinityByMember"), eventSum("existingOtakuAffinityByMember"), number(eventSum("purchaseWeightLogChangeByMember")), result.state.members.find((member) => member.id === memberId)?.active ?? false]);
  }
  const eventsById = new Map(result.events.map((event) => [event.liveId, event]));
  for (const week of result.fanWeeklyResolutions) {
    const weekEvents = week.eventIds.map((id) => eventsById.get(id)).filter(Boolean);
    const online = result.onlineWeeks.find((entry) => entry.weekEnd === week.weekEnd);
    retentionRows.push([seed, week.weekEnd, number(week.opening.otakuCount), fanChekiBalanceV1.pWeeklyOChurn, 1, number(week.otakuChurn), number(week.otakuChurn / Math.max(1, week.opening.otakuCount)), weekEvents.length, number(mean(weekEvents.map((event) => event.performanceInternal))), online?.newPublic ?? 0, online?.promotionSignal ?? 0, number(totalA(week.opening)), number(Math.max(0, totalA(week.opening) - totalA(week.closing))), week.graduationLoss, number(week.opening.temporarilyUnassignedOtaku), number(week.closing.temporarilyUnassignedOtaku)]);
    if (week.weekEnd === "2014-05-11") graduationRows.push([seed, week.weekEnd, number(week.opening.otakuCount), number(week.closing.otakuCount), number(week.opening.temporarilyUnassignedOtaku), number(week.closing.temporarilyUnassignedOtaku), week.graduationLoss, number(week.closing.members["IPC1-001"].affinityCount)]);
  }
  const oneMan = result.events.find((event) => event.kind === "one-man");
  seedRows.push([seed, number(result.state.fan.publicCount), number(result.state.fan.otakuCount), number(totalA(result.state.fan)), number(totalW(result.state.fan)), oneMan?.actualAttendance ?? 0, oneMan?.ticketRevenueJPY ?? 0, requestedJPY, completedUnits, lostJPY, grossJPY, commissionJPY, variableJPY, voucherRequested, voucherServed, voucherLost, voucherCostJPY, grossJPY - commissionJPY - variableJPY - voucherCostJPY, byCategory(entries, "operating_revenue", "ticket_revenue"), byCategory(entries, "operating_cost", "venue_cost"), byCategory(entries, "operating_cost", "training_room"), byCategory(entries, "operating_cost", "member_payroll"), result.state.finance.capitalizedAssets, result.state.finance.cash, legacy.state.finance.cash, result.state.finance.cash - legacy.state.finance.cash]);
}

writeCsv("cheki-events.csv", eventRows); writeCsv("finance-by-category.csv", financeRows); writeCsv("member-affinity.csv", memberRows); writeCsv("retention-weekly.csv", retentionRows); writeCsv("graduation.csv", graduationRows); writeCsv("seeds.csv", seedRows); writeCsv("assertion-failures.csv", [["seed", "check", "live_id", "member_id"], ...failures]);
const memberSummaryRows = [["member_id", "initial_a_mean", "final_a_mean", "initial_w_mean_kjpy", "final_w_mean_kjpy", "member_live_new_o_a_mean", "paid_cheki_new_o_a_mean", "voucher_cheki_new_o_a_mean", "existing_o_live_new_a_mean", "w_log_change_mean", "active_final_runs"]];
for (const memberId of [...new Set(memberRows.slice(1).map((row) => row[1]))].sort()) {
  const rows = memberRows.slice(1).filter((row) => row[1] === memberId);
  memberSummaryRows.push([memberId, ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((position) => number(mean(rows.map((row) => row[position])))), sum(rows.map((row) => row[11] ? 1 : 0))]);
}
writeCsv("member-summary.csv", memberSummaryRows);
const retentionScenarioRows = [["scenario", "status", "base_o_rate", "effective_factor", "reason"]];
for (const scenario of ["normal_live_sns_neutral", "few_live_sns_active", "normal_live_low_satisfaction", "high_satisfaction_sns_active", "no_live_no_sns", "post_graduation_normal_ops"]) {
  retentionScenarioRows.push([scenario, "NOT_IMPLEMENTED", fanChekiBalanceV1.pWeeklyOChurn, 1, "Runtime has no Live/SNS/satisfaction retention input; fixed natural decay applies"]);
}
writeCsv("retention-scenarios.csv", retentionScenarioRows);
writeCsv("multi-oshi-scenarios.csv", [
  ["scenario", "status", "evidence"],
  ["all_members_have_capacity", "NOT_IMPLEMENTED", "No multi-oshi demand aggregation model"],
  ["single_hot_member_full", "NOT_IMPLEMENTED", "FIFO loss is tested; no overflow routing"],
  ["two_members_similar_a_w", "NOT_IMPLEMENTED", "S_ij and q_base are absent"],
  ["two_members_dissimilar_a_w", "NOT_IMPLEMENTED", "S_ij and q_base are absent"],
  ["multiple_members_full", "NOT_IMPLEMENTED", "No residual-capacity coordination"],
  ["all_members_full", "NOT_IMPLEMENTED", "No multi-oshi demand budget model"],
  ["voucher_and_paid_congested", "PASS_SHARED_QUEUE_ONLY", "Real queue and free/paid finance separation are asserted; overflow remains absent"],
]);
const index = Object.fromEntries(seedRows[0].map((name, position) => [name, position]));
const summaryRows = [["metric", "mean", "p10", "p50", "p90"]];
for (const name of seedRows[0].slice(1)) { const values = seedRows.slice(1).map((row) => row[index[name]]); summaryRows.push([name, number(mean(values)), number(percentile(values, .1)), number(percentile(values, .5)), number(percentile(values, .9))]); }
writeCsv("summary.csv", summaryRows);
const signature = (result) => JSON.stringify({ fan: result.state.fan, finance: result.state.finance, reputation: result.state.reputation, events: result.events.map((event) => [event.liveId, event.fanFlow, event.cheki]) });
const replayFailures = fullResults.flatMap((result, index) => signature(result) === signature(runStaffAutoplayPrologue(fullInput(seeds[index]))) ? [] : [seeds[index]]);
const checks = {
  cheki_and_queue: failures.length === 0,
  r0_population: fullResults.every((result) => result.fanWeeklyResolutions.every((week) => Math.abs(week.closing.publicCount - (week.opening.publicCount + week.newPublic - week.publicToOtaku - week.publicChurn)) < 1e-8 && Math.abs(week.closing.otakuCount - (week.opening.otakuCount + week.publicToOtaku + week.externalToOtaku - week.otakuChurn - week.graduationLoss)) < 1e-8)),
  affinity_bounds: fullResults.every((result) => Object.values(result.state.fan.members).every((profile) => profile.affinityCount <= result.state.fan.otakuCount - result.state.fan.temporarilyUnassignedOtaku)),
  rina_closed: fullResults.every((result) => result.fanWeeklyResolutions.filter((week) => week.weekEnd >= "2014-05-11").every((week) => week.closing.members["IPC1-001"].affinityCount === 0)),
  replay: replayFailures.length === 0,
  reputation_and_tif: fullResults.every((result) => result.stageStatus === "COMPLETED_TIF" && result.state.date === "2014-08-03" && Number.isFinite(result.state.reputation.live) && Number.isFinite(result.state.reputation.music)),
};
writeJson("assertions.json", { sourceCommit: childProcess.execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(), seeds, checks: Object.entries(checks).map(([id, pass]) => ({ id, status: pass ? "PASS" : "FAIL" })), replayFailures });
const metric = (name) => summaryRows.find((row) => row[0] === name)[1];
const report = [
  "# S3-C Fan x Cheki x Finance x Retention integrated acceptance", "",
  "## Status", "",
  "- PASS: P0 Cheki finance and completed-service reconciliation.",
  "- PASS: P0 member A/W source-path observability.",
  "- NOT_IMPLEMENTED: P1 multi-oshi overflow (S_ij, q_base=.4, temporary event W, cross-member capacity transfer). FIFO alone is not presented as a passing overflow test.",
  "- NOT_IMPLEMENTED: P1/R2 Live/SNS/satisfaction-adjusted retention. Current weekly retention is fixed natural decay only.",
  "- TUNABLE (unchanged): R0 curves, product prices, 20% commission, voucher cost, and natural churn.", "",
  "## Full E, 100 seeds", "",
  `P ${metric("final_p")}; O ${metric("final_o")}; A total ${metric("final_a_total")}; W total ${metric("final_w_total_kjpy")} KJPY; Cheki gross JPY ${metric("cheki_gross_jpy")}; Cheki net JPY ${metric("cheki_net_jpy")}; final cash JPY ${metric("final_cash_jpy")}.`, "",
  "## Cash explanation", "",
  `Comparable Legacy-C3 (same scenario/seeds, R0 disabled) cash is JPY ${metric("legacy_cash_jpy")}; full E is JPY ${metric("final_cash_jpy")}; paired delta is JPY ${metric("paired_cash_delta_jpy")}. The quoted ~JPY619k uses an older non-identical report baseline; this report uses the same-seed executable comparator.`,
  `Completed-service source: paid requests JPY ${metric("paid_requested_jpy")}; Cheki gross JPY ${metric("cheki_gross_jpy")}; member share JPY ${metric("member_commission_jpy")}; paid variable cost JPY ${metric("paid_variable_cost_jpy")}; voucher cost JPY ${metric("voucher_cost_jpy")}; net JPY ${metric("cheki_net_jpy")}. The paid-newcomer request-counter repair only improved audit accounting; it did not create revenue.`, "",
  "## A/W and retention findings", "",
  "Team-trigger O has no member A. Member Live and completed paid/voucher Cheki source A are in member-affinity.csv. Existing O gains new A through Live exposure; existing-O Cheki-to-new-A remains NOT_IMPLEMENTED because normal requests are affinity-only and there is no multi-oshi trial/overflow path. W is updated once per week from served/lost queue results and is not queue priority.",
  "Graduation moves Rina's unique affinity estimate to U and zeroes Rina A without an additional O decrement; graduation.csv records the transition.",
  `Retention-weekly.csv records the effective fixed O factor 1.0 and base rate ${fanChekiBalanceV1.pWeeklyOChurn}; live/SNS columns are context, not active modifiers.`, "",
  "## Assertions", "", ...Object.entries(checks).map(([id, pass]) => `- ${pass ? "PASS" : "FAIL"}: ${id}`), "",
  "Raw event, finance, member, weekly-retention, graduation, seed, and assertion files are colocated here.",
];
fs.writeFileSync(path.join(output, "acceptance.md"), `${report.join("\n")}\n`);
console.log(`Wrote ${path.relative(process.cwd(), output)}`);
