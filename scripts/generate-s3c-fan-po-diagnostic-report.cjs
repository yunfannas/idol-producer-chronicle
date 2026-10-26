/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * S3-C fan P/O diagnostic: deliberately keeps the Staff schedule, contracts,
 * finance, seed list, and all non-target mechanisms fixed while measuring
 * five fan-flow configurations.
 */
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-s3c-fan-po-diagnostic-report.cjs"));

const {
  runStaffAutoplayPrologue,
  staffAutoplayScenarioV1,
  newcomerVoucherTrialV1,
} = jiti("../src/lib/runtime/staff-autoplay.ts");
const { audienceChannelDiagnosticV1 } = jiti("../src/lib/runtime/audience-channels.ts");
const { fanChekiBalanceV1 } = jiti("../src/lib/runtime/fan.ts");
const { staffOnlineAcquisitionV11, staffExternalAudienceDemandV11 } = jiti("../src/lib/runtime/fan-acquisition.ts");

const output = path.join(process.cwd(), "reports", "staff-baseline", "s3c-fan-po-diagnostic-v1", "a-e-100-seeds");
fs.mkdirSync(output, { recursive: true });
const seeds = Array.from({ length: 100 }, (_, index) => index + 1);
const experiments = [
  { id: "A", name: "Baseline", overrides: {} },
  { id: "B", name: "Conversion 0.10", overrides: { activePublicToOtakuRate: 0.10 } },
  { id: "C", name: "No Cheki Conversion", overrides: { disablePaidChekiToOtaku: true } },
  { id: "D", name: "No External Direct O", overrides: { disableExternalDirectOtaku: true } },
  { id: "E", name: "No Voucher Conversion", overrides: { disableVoucherChekiToOtaku: true } },
];
const command = "npm run report:s3c-fan-po-diagnostic";
const sourceCommit = childProcess.execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const number = (value) => Number(Number(value).toFixed(6));
const sum = (items) => items.reduce((total, value) => total + value, 0);
const mean = (items) => sum(items) / Math.max(1, items.length);
const percentile = (items, p) => {
  const ordered = [...items].sort((left, right) => left - right);
  return ordered[Math.max(0, Math.min(ordered.length - 1, Math.round((ordered.length - 1) * p)))];
};
const csv = (rows) => `${rows.map((row) => row.map((value) => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}).join(",")).join("\n")}\n`;
const writeCsv = (name, rows) => fs.writeFileSync(path.join(output, name), csv(rows));
const eventAttendance = (event) => event.fanFlow.otakuAttendance + event.fanFlow.publicAttendance + event.fanFlow.externalAudience;
const total = (result, selector) => sum(result.events.map(selector));
const flowTotals = (result) => ({
  newP: sum(result.fanWeeklyResolutions.map((week) => week.newPublic)),
  snsNewP: sum(result.fanWeeklyResolutions.map((week) => week.snsNewPublic)),
  eventExposureNewP: sum(result.fanWeeklyResolutions.map((week) => week.eventExposureNewPublic)),
  teamLiveToO: sum(result.fanWeeklyResolutions.map((week) => week.teamLiveToOtaku)),
  memberLiveToO: sum(result.fanWeeklyResolutions.map((week) => week.memberLiveToOtaku)),
  paidChekiToO: sum(result.fanWeeklyResolutions.map((week) => week.paidChekiToOtaku)),
  voucherChekiToO: sum(result.fanWeeklyResolutions.map((week) => week.voucherChekiToOtaku)),
  externalIdolToO: sum(result.fanWeeklyResolutions.map((week) => week.externalIdolToOtaku)),
  externalGeneralToO: sum(result.fanWeeklyResolutions.map((week) => week.externalGeneralToOtaku)),
  externalToO: sum(result.fanWeeklyResolutions.map((week) => week.externalToOtaku)),
  publicChurn: sum(result.fanWeeklyResolutions.map((week) => week.publicChurn)),
  otakuChurn: sum(result.fanWeeklyResolutions.map((week) => week.otakuChurn)),
  graduationLoss: sum(result.fanWeeklyResolutions.map((week) => week.graduationLoss)),
  chekiServices: total(result, (event) => Object.values(event.cheki.queues).reduce((value, queue) => value + queue.completedUnits, 0)),
  freeVoucherServices: total(result, (event) => Object.values(event.cheki.queues).reduce((value, queue) => value + queue.freeTrialServed, 0)),
});
const compact = (result) => {
  const oneMan = result.events.find((event) => event.kind === "one-man");
  const flow = flowTotals(result);
  return {
    finalP: result.state.fan.publicCount,
    finalO: result.state.fan.otakuCount,
    finalCash: result.state.finance.cash,
    totalPopulation: result.state.fan.publicCount + result.state.fan.otakuCount,
    netGrowth: result.state.fan.publicCount + result.state.fan.otakuCount - result.fanWeeklyResolutions[0].opening.publicCount - result.fanWeeklyResolutions[0].opening.otakuCount,
    oneManAttendance: oneMan?.actualAttendance ?? 0,
    oneManTicketRevenue: oneMan?.ticketRevenueJPY ?? 0,
    ...flow,
  };
};
const replaySignature = (result) => JSON.stringify({
  p: result.state.fan.publicCount,
  o: result.state.fan.otakuCount,
  cash: result.state.finance.cash,
  finance: result.state.finance.entries.map((entry) => entry.id),
  events: result.events.map((event) => [event.liveId, event.actualAttendance, event.fanFlow.publicToOtaku, event.fanFlow.externalToOtaku]),
  weeks: result.fanWeeklyResolutions.map((week) => [week.weekEnd, week.closing.publicCount, week.closing.otakuCount]),
});

const eventRows = [["experiment", "seed", "date", "live_id", "kind", "capacity", "actual_attendance", "otaku_attendance", "public_attendance", "external_audience", "external_exposure", "team_live_to_o", "member_live_to_o", "paid_cheki_to_o", "voucher_cheki_to_o", "x_idol_to_o", "x_general_to_o", "ticket_revenue_jpy", "cheki_gross_jpy", "queue_completed_units"]];
const weekRows = [["experiment", "seed", "week_end", "event_ids", "opening_p", "opening_o", "sns_new_p", "song_new_p", "work_new_p", "taiban_exposure_new_p", "free_live_exposure_new_p", "other_live_exposure_new_p", "event_exposure_new_p", "new_p", "team_live_to_o", "member_live_to_o", "paid_cheki_to_o", "voucher_cheki_to_o", "x_idol_to_o", "x_general_to_o", "external_to_o", "public_churn", "otaku_churn", "graduation_loss", "closing_p", "closing_o"]];
const attributionRows = [["experiment", "seed", "live_id", "date", "p_aware", "p_demand", "p_ticketed", "p_active_attend", "p_referred_attend", "x_configured_demand", "x_idol_attend", "x_general_attend", "active_p_to_o", "referred_p_to_o", "x_idol_to_o", "x_general_to_o", "external_exposure"]];
const chekiRows = [["experiment", "seed", "live_id", "date", "member_id", "requested_units", "completed_units", "free_requested", "free_served", "free_lost", "queue_lost_jpy", "gross_jpy", "variable_cost_jpy"]];
const financeRows = [["experiment", "seed", "entry_id", "date", "kind", "amount_jpy", "category", "event_id", "member_id"]];
const seedRows = [["experiment", "seed", "final_p", "final_o", "p_plus_o", "net_growth", "online_new_p", "event_exposure_new_p", "team_live_to_o", "member_live_to_o", "paid_cheki_to_o", "voucher_cheki_to_o", "x_idol_to_o", "x_general_to_o", "external_to_o", "public_churn", "otaku_churn", "graduation_loss", "cheki_services", "free_voucher_services", "one_man_attendance", "one_man_ticket_revenue_jpy", "final_cash_jpy"]];
const failures = {
  weekly_conservation: [],
  event_population_and_capacity: [],
  single_event_conversion_dedup: [],
  cheki_queue_capacity: [],
  free_event_revenue: [],
  finance_ledger: [],
  rina_graduation: [],
  replay_idempotency: [],
  tif_completion: [],
};
const allCompact = new Map();

for (const experiment of experiments) {
  for (const seed of seeds) {
    const input = { route: "B", seed, s3Variant: "S3-C", fanAcquisitionStage: "C3", fanFlowDiagnosticOverrides: experiment.overrides };
    const result = runStaffAutoplayPrologue(input);
    const key = `${experiment.id}:${seed}`;
    const summary = compact(result);
    allCompact.set(key, summary);
    seedRows.push([experiment.id, seed, number(summary.finalP), number(summary.finalO), number(summary.totalPopulation), number(summary.netGrowth), number(summary.snsNewP), number(summary.eventExposureNewP), summary.teamLiveToO, summary.memberLiveToO, summary.paidChekiToO, summary.voucherChekiToO, summary.externalIdolToO, summary.externalGeneralToO, summary.externalToO, number(summary.publicChurn), number(summary.otakuChurn), summary.graduationLoss, summary.chekiServices, summary.freeVoucherServices, summary.oneManAttendance, summary.oneManTicketRevenue, summary.finalCash]);
    for (const event of result.events) {
      const queue = Object.values(event.cheki.queues).reduce((value, line) => ({
        completed: value.completed + line.completedUnits,
        freeServed: value.freeServed + line.freeTrialServed,
      }), { completed: 0, freeServed: 0 });
      eventRows.push([experiment.id, seed, event.date, event.liveId, event.kind, event.audienceCapacity, event.actualAttendance, event.fanFlow.otakuAttendance, event.fanFlow.publicAttendance, event.fanFlow.externalAudience, event.fanFlow.externalExposure, event.fanFlow.teamLiveToOtaku, event.fanFlow.memberLiveToOtaku, event.fanFlow.paidChekiToOtaku, event.fanFlow.voucherChekiToOtaku, event.fanFlow.externalIdolToOtaku, event.fanFlow.externalGeneralToOtaku, event.ticketRevenueJPY, event.chekiGrossJPY, queue.completed]);
      const a = event.audienceAttribution;
      attributionRows.push([experiment.id, seed, event.liveId, event.date, a?.awarePublic ?? "", a?.publicDemand ?? "", a?.ticketedPublic ?? "", a?.activeIntentPublicWatching ?? "", a?.referredPublicWatching ?? "", a?.configuredExternalDemand ?? "", a?.externalIdolWatching ?? "", a?.externalGeneralWatching ?? "", a?.activePublicToOtaku ?? "", a?.referredPublicToOtaku ?? "", a?.externalIdolToOtaku ?? "", a?.externalGeneralToOtaku ?? "", a?.externalExposure ?? ""]);
      for (const [memberId, queueLine] of Object.entries(event.cheki.queues)) {
        const lineGross = event.cheki.lines.filter((line) => line.memberId === memberId).reduce((value, line) => value + line.grossSales, 0);
        const lineCost = event.cheki.lines.filter((line) => line.memberId === memberId).reduce((value, line) => value + line.variableCost, 0);
        chekiRows.push([experiment.id, seed, event.liveId, event.date, memberId, queueLine.requestedUnits, queueLine.completedUnits, queueLine.freeTrialRequested, queueLine.freeTrialServed, queueLine.freeTrialLost, queueLine.queueLostJPY, lineGross, lineCost + queueLine.freeTrialVariableCostJPY]);
      }
    }
    for (const week of result.fanWeeklyResolutions) weekRows.push([experiment.id, seed, week.weekEnd, week.eventIds.join(" "), number(week.opening.publicCount), number(week.opening.otakuCount), week.snsNewPublic, week.songNewPublic, week.workNewPublic, week.taibanExposureNewPublic, week.freeLiveExposureNewPublic, week.otherLiveExposureNewPublic, week.eventExposureNewPublic, week.newPublic, week.teamLiveToOtaku, week.memberLiveToOtaku, week.paidChekiToOtaku, week.voucherChekiToOtaku, week.externalIdolToOtaku, week.externalGeneralToOtaku, week.externalToOtaku, number(week.publicChurn), number(week.otakuChurn), week.graduationLoss, number(week.closing.publicCount), number(week.closing.otakuCount)]);
    for (const entry of result.state.finance.entries) financeRows.push([experiment.id, seed, entry.id, entry.date, entry.kind, entry.amount, entry.category, entry.eventId ?? "", entry.memberId ?? ""]);

    const eps = 1e-9;
    if (result.fanWeeklyResolutions.some((week) => Math.abs(week.closing.publicCount - (week.opening.publicCount + week.newPublic - week.publicToOtaku - week.publicChurn)) > eps
      || Math.abs(week.closing.otakuCount - (week.opening.otakuCount + week.publicToOtaku + week.externalToOtaku - week.otakuChurn - week.graduationLoss)) > eps
      || week.eventExposureNewPublic !== week.taibanExposureNewPublic + week.freeLiveExposureNewPublic + week.otherLiveExposureNewPublic)) failures.weekly_conservation.push(key);
    if (result.events.some((event) => eventAttendance(event) !== event.actualAttendance || event.actualAttendance > event.audienceCapacity)) failures.event_population_and_capacity.push(key);
    if (result.events.some((event) => event.fanFlow.publicToOtaku > event.fanFlow.publicAttendance
      || event.fanFlow.externalIdolToOtaku + event.fanFlow.externalGeneralToOtaku + event.fanFlow.voucherChekiToOtaku !== event.fanFlow.externalToOtaku
      || event.fanFlow.externalExposure + event.fanFlow.externalIdolToOtaku + event.fanFlow.externalGeneralToOtaku > event.fanFlow.externalAudience
      || event.fanFlow.freeTrialConversionsByMember && Object.values(event.fanFlow.freeTrialConversionsByMember).reduce((value, count) => value + count, 0) > event.fanFlow.freeTrialServed)) failures.single_event_conversion_dedup.push(key);
    if (result.events.some((event) => Object.values(event.cheki.queues).some((queue) => queue.completedUnits > queue.requestedUnits || queue.completedUnitsByTier["1000"] + queue.completedUnitsByTier["2000"] !== queue.completedUnits || queue.freeTrialServed > queue.freeTrialRequested))) failures.cheki_queue_capacity.push(key);
    if (result.events.filter((event) => event.kind === "free-mall").some((event) => event.ticketRevenueJPY !== 0 || event.chekiGrossJPY !== 0 || event.chekiCommissionJPY !== 0)) failures.free_event_revenue.push(key);
    const expectedCash = 3_000_000 + result.state.finance.operatingRevenue - result.state.finance.operatingCost - result.state.finance.capitalizedAssets + result.state.finance.loans;
    if (new Set(result.state.finance.entries.map((entry) => entry.id)).size !== result.state.finance.entries.length || result.state.finance.cash !== expectedCash) failures.finance_ledger.push(key);
    if (result.events.filter((event) => event.date > "2014-05-11").some((event) => event.participantIds.includes("IPC1-001") || event.cheki.queues["IPC1-001"] || event.fanFlow.initialAffinityByMember["IPC1-001"] || event.fanFlow.existingOtakuAffinityByMember["IPC1-001"]) || result.fanWeeklyResolutions.filter((week) => week.weekEnd >= "2014-05-11").some((week) => week.closing.members["IPC1-001"].affinityCount !== 0)) failures.rina_graduation.push(key);
    if (result.stageStatus !== "COMPLETED_TIF") failures.tif_completion.push(key);
    const replay = runStaffAutoplayPrologue(input);
    if (replaySignature(replay) !== replaySignature(result)) failures.replay_idempotency.push(key);
  }
}

writeCsv("events.csv", eventRows);
writeCsv("weekly.csv", weekRows);
writeCsv("attribution.csv", attributionRows);
writeCsv("cheki-member.csv", chekiRows);
writeCsv("finance.csv", financeRows);
writeCsv("seeds.csv", seedRows);

const metrics = ["finalP", "finalO", "totalPopulation", "netGrowth", "snsNewP", "eventExposureNewP", "teamLiveToO", "memberLiveToO", "paidChekiToO", "voucherChekiToO", "externalIdolToO", "externalGeneralToO", "externalToO", "publicChurn", "otakuChurn", "graduationLoss", "chekiServices", "freeVoucherServices", "oneManAttendance", "oneManTicketRevenue", "finalCash"];
const experimentRows = [["experiment", "name", "metric", "mean", "p10", "p50", "p90"]];
for (const experiment of experiments) {
  const rows = seeds.map((seed) => allCompact.get(`${experiment.id}:${seed}`));
  for (const metric of metrics) {
    const values = rows.map((row) => row[metric]);
    experimentRows.push([experiment.id, experiment.name, metric, number(mean(values)), number(percentile(values, 0.1)), number(percentile(values, 0.5)), number(percentile(values, 0.9))]);
  }
}
writeCsv("experiment-summary.csv", experimentRows);
const pairedRows = [["experiment", "metric", "mean_delta_vs_a", "p10_delta", "p50_delta", "p90_delta"]];
for (const experiment of experiments.filter((item) => item.id !== "A")) {
  for (const metric of metrics) {
    const deltas = seeds.map((seed) => allCompact.get(`${experiment.id}:${seed}`)[metric] - allCompact.get(`A:${seed}`)[metric]);
    pairedRows.push([experiment.id, metric, number(mean(deltas)), number(percentile(deltas, 0.1)), number(percentile(deltas, 0.5)), number(percentile(deltas, 0.9))]);
  }
}
writeCsv("paired-deltas.csv", pairedRows);

const checks = Object.entries(failures).map(([id, failedRuns]) => ({ id, pass: failedRuns.length === 0, checkedRuns: experiments.length * seeds.length, failedRuns }));
fs.writeFileSync(path.join(output, "assertions.json"), `${JSON.stringify({ experiments: experiments.map(({ id, name }) => ({ id, name })), seeds, checks }, null, 2)}\n`);
const baseline = Object.fromEntries(metrics.map((metric) => [metric, experimentRows.find((row) => row[0] === "A" && row[2] === metric)?.[3]]));
const delta = (experiment, metric) => pairedRows.find((row) => row[0] === experiment && row[1] === metric)?.[2];
fs.writeFileSync(path.join(output, "effective-config.json"), `${JSON.stringify({
  sourceCommit,
  route: "B",
  s3Variant: "S3-C",
  fanAcquisitionStage: "C3",
  seeds,
  actualBaselineEffectiveAudienceChannelConfig: { ...audienceChannelDiagnosticV1 },
  legacyConversionParametersNotUsedByC3: { pPublicToOtaku: fanChekiBalanceV1.pPublicToOtaku, pExternalToOtaku: fanChekiBalanceV1.pExternalToOtaku },
  newcomerVoucher: newcomerVoucherTrialV1,
  onlineTunables: staffOnlineAcquisitionV11,
  externalDemandTunables: staffExternalAudienceDemandV11,
  experiments,
  command,
  scenarioVersion: staffAutoplayScenarioV1.version,
}, null, 2)}\n`);
fs.writeFileSync(path.join(output, "summary.md"), `# Chronicle S3-C Fan P/O diagnostic — paired 100-seed A–E\n\n- Source commit at generation: \`${sourceCommit}\`\n- Command: \`${command}\`\n- Route B / Staff default / S3-C / C3; seeds 1–100 are reused for every experiment. No schedule, contract, finance, capacity, or non-target parameter changes.\n- This is an audit, not a calibration edit. P≈600/O≈300 is a reference, not an assertion.\n\n## Effective baseline path\n\nC3 resolves \`resolveDiagnosticAudienceChannels\` per Live. Its effective active \`P_active→O\` rate is **${audienceChannelDiagnosticV1.activePublicToOtakuRate}**; C3 does not use legacy \`fanChekiBalanceV1.pPublicToOtaku=${fanChekiBalanceV1.pPublicToOtaku}\` except in C2. The weekly ledger commits sampled P conversions once, caps them by the surviving P pool, and writes remaining external watchers only through the Sunday SNS/external exposure deduplication.\n\nC3 currently has no paid-Cheki→new-O mechanism: paid Cheki changes the real queue, A/W, and finance only. Its default newcomer-voucher contract is disabled and C3 deliberately bypasses that second hazard. Therefore C/E are meaningful absence checks, not evidence that a nonzero source was hidden.\n\n## Baseline and paired deltas\n\n- A baseline: final P ${baseline.finalP}, O ${baseline.finalO}, P+O ${baseline.totalPopulation}, net growth ${baseline.netGrowth}, cash ¥${baseline.finalCash}; Team Live→O ${baseline.teamLiveToO}, X→O ${baseline.externalToO}, SNS→P ${baseline.snsNewP}, external exposure→P ${baseline.eventExposureNewP}; P churn ${baseline.publicChurn}, O churn ${baseline.otakuChurn}.\n- B (active P→O 0.10): paired ΔP ${delta("B", "finalP")}, ΔO ${delta("B", "finalO")}, ΔP+O ${delta("B", "totalPopulation")}, Δcash ¥${delta("B", "finalCash")}, ΔTeam Live→O ${delta("B", "teamLiveToO")}.\n- C (no paid Cheki conversion): paired ΔP ${delta("C", "finalP")}, ΔO ${delta("C", "finalO")}, Δcash ¥${delta("C", "finalCash")}, Δpaid-Cheki→O ${delta("C", "paidChekiToO")}.\n- D (no external direct O, X retained as exposure): paired ΔP ${delta("D", "finalP")}, ΔO ${delta("D", "finalO")}, ΔP+O ${delta("D", "totalPopulation")}, Δcash ¥${delta("D", "finalCash")}, ΔX→O ${delta("D", "externalToO")}.\n- E (no voucher conversion): paired ΔP ${delta("E", "finalP")}, ΔO ${delta("E", "finalO")}, Δcash ¥${delta("E", "finalCash")}, Δvoucher→O ${delta("E", "voucherChekiToO")}.\n\n## Findings\n\nThe report’s paired B comparison is the causal check for whether 0.35 is in the active path. C and E show whether any currently active Cheki/newcomer path can explain O. D separates direct external conversion from delayed X→P exposure. Use the per-week source ledger—not terminal delta alone—for direct channel contribution, because every ablation changes later P/O population bases.\n\n## Files\n\n- \`effective-config.json\`: actual C3 baseline settings and each diagnostic override.\n- \`weekly.csv\`: all 500×weekly conservation rows, including every requested P/O flow lane.\n- \`events.csv\` / \`attribution.csv\`: live population, conversion, demand, and exposure facts.\n- \`cheki-member.csv\` / \`finance.csv\`: every service queue and ledger fact.\n- \`seeds.csv\` / \`experiment-summary.csv\` / \`paired-deltas.csv\`: distribution and paired analysis.\n- \`assertions.json\`: weekly conservation, capacity, deduplication, queue, free-revenue, ledger, graduation, replay, and TIF checks.\n\n## Assertions\n\n${checks.map((check) => `- ${check.pass ? "PASS" : "FAIL"}: ${check.id} (${check.checkedRuns - check.failedRuns.length}/${check.checkedRuns}); failures: ${check.failedRuns.join(", ") || "none"}`).join("\n")}\n`);
console.log(`Wrote ${path.relative(process.cwd(), output)}`);
