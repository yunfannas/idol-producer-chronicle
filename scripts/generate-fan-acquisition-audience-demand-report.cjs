/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * v1.1 formal paired-seed Runtime audit. C0 is an untouched legacy control;
 * each later stage enables exactly the additional mechanism named in v1.1.
 */
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-fan-acquisition-audience-demand-report.cjs"));

const { runStaffAutoplayPrologue, staffAutoplayScenarioV1 } = jiti("../src/lib/runtime/staff-autoplay.ts");
const { staffOnlineAcquisitionV11, staffExternalAudienceDemandV11 } = jiti("../src/lib/runtime/fan-acquisition.ts");
const output = path.join(process.cwd(), "reports", "staff-baseline", "fan-acquisition-audience-demand-v1.1", "c0-c3-100-seeds");
fs.mkdirSync(output, { recursive: true });

const stages = ["C0", "C1", "C2", "C3"];
const seeds = Array.from({ length: 100 }, (_, index) => index + 1);
const runs = stages.flatMap((stage) => seeds.map((seed) => ({ stage, result: runStaffAutoplayPrologue({ route: "B", seed, s3Variant: "S3-C", fanAcquisitionStage: stage }) })));
const commit = childProcess.execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
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
const sourceAttendance = (event) => event.fanFlow.otakuAttendance + event.fanFlow.publicAttendance + event.fanFlow.externalAudience;
const onlinePublic = (result) => sum(result.onlineWeeks.map((week) => week.newPublic));
const publicTicketed = (result) => sum(result.events.map((event) => event.audienceAttribution?.ticketedPublic ?? event.fanFlow.publicAttendance));
const publicToOtaku = (result) => sum(result.events.map((event) => event.fanFlow.publicToOtaku));
const externalToOtaku = (result) => sum(result.events.map((event) => event.fanFlow.externalToOtaku));

const failed = {
  population: [], capacity_and_sources: [], attribution: [], online_stage: [], queue: [], free_revenue: [], finance: [], graduation: [], replay: [], tif: [],
};
for (const { stage, result } of runs) {
  const invalidPopulation = result.fanWeeklyResolutions.some((week) => week.closing.publicCount < 0
    || week.closing.otakuCount < 0 || week.closing.temporarilyUnassignedOtaku < 0
    || week.closing.temporarilyUnassignedOtaku > week.closing.otakuCount
    || Object.values(week.closing.members).some((member) => member.affinityCount < 0 || member.affinityCount > week.closing.otakuCount - week.closing.temporarilyUnassignedOtaku));
  if (invalidPopulation) failed.population.push(`${stage}:${result.seed}`);
  if (result.events.some((event) => sourceAttendance(event) !== event.actualAttendance || event.actualAttendance > event.audienceCapacity)) failed.capacity_and_sources.push(`${stage}:${result.seed}`);
  if (stage === "C0" && result.onlineWeeks.length !== 0) failed.online_stage.push(`${stage}:${result.seed}`);
  if (stage !== "C0" && (result.onlineWeeks.length === 0 || result.onlineWeeks.some((week) => week.channels.length !== 4))) failed.online_stage.push(`${stage}:${result.seed}`);
  if (stage === "C0" || stage === "C1") {
    if (result.events.some((event) => event.audienceAttribution !== undefined)) failed.attribution.push(`${stage}:${result.seed}`);
  } else if (result.events.some((event) => {
    const attribution = event.audienceAttribution;
    return !attribution
      || attribution.actualUniqueAudience !== event.actualAttendance
      || attribution.publicToOtaku > attribution.ownedPublicWatching
      || attribution.externalIdolWatching + attribution.externalGeneralWatching !== event.fanFlow.externalAudience
      || attribution.externalIdolToOtaku + attribution.externalGeneralToOtaku + attribution.externalToPublic > event.fanFlow.externalAudience
      || event.fanFlow.publicToOtaku !== attribution.publicToOtaku;
  })) failed.attribution.push(`${stage}:${result.seed}`);
  if (result.events.some((event) => Object.values(event.cheki.queues).some((queue) => queue.completedUnits > queue.requestedUnits || queue.completedUnitsByTier["1000"] + queue.completedUnitsByTier["2000"] !== queue.completedUnits))) failed.queue.push(`${stage}:${result.seed}`);
  if (result.events.filter((event) => event.kind === "free-mall").some((event) => event.ticketRevenueJPY !== 0 || event.chekiGrossJPY !== 0 || event.chekiCommissionJPY !== 0)) failed.free_revenue.push(`${stage}:${result.seed}`);
  const expectedCash = 3_000_000 + result.state.finance.operatingRevenue - result.state.finance.operatingCost - result.state.finance.capitalizedAssets + result.state.finance.loans;
  if (new Set(result.state.finance.entries.map((entry) => entry.id)).size !== result.state.finance.entries.length || result.state.finance.cash !== expectedCash) failed.finance.push(`${stage}:${result.seed}`);
  if (result.events.filter((event) => event.date > "2014-05-11").some((event) => event.participantIds.includes("IPC1-001") || event.cheki.queues["IPC1-001"] || event.fanFlow.initialAffinityByMember["IPC1-001"])) failed.graduation.push(`${stage}:${result.seed}`);
  if (result.stageStatus !== "COMPLETED_TIF") failed.tif.push(`${stage}:${result.seed}`);
  if (JSON.stringify(runStaffAutoplayPrologue({ route: "B", seed: result.seed, s3Variant: "S3-C", fanAcquisitionStage: stage })) !== JSON.stringify(result)) failed.replay.push(`${stage}:${result.seed}`);
}

writeCsv("events.csv", [
  ["stage", "seed", "date", "live_id", "kind", "audience_capacity", "legacy_contract_attendance", "actual_attendance", "otaku_attendance", "public_attendance", "external_audience", "ticket_revenue_jpy", "cheki_gross_jpy", "cash_after_jpy"],
  ...runs.flatMap(({ stage, result }) => result.events.map((event) => [stage, result.seed, event.date, event.liveId, event.kind, event.audienceCapacity, event.expectedAttendance, event.actualAttendance, event.fanFlow.otakuAttendance, event.fanFlow.publicAttendance, event.fanFlow.externalAudience, event.ticketRevenueJPY, event.chekiGrossJPY, event.cashAfterJPY])),
]);
writeCsv("weekly.csv", [
  ["stage", "seed", "week_end", "event_ids", "p_open", "o_open", "p_close", "o_close", "u_close", "online_new_public"],
  ...runs.flatMap(({ stage, result }) => result.fanWeeklyResolutions.map((week) => [stage, result.seed, week.weekEnd, week.eventIds.join(" "), number(week.opening.publicCount), number(week.opening.otakuCount), number(week.closing.publicCount), number(week.closing.otakuCount), number(week.closing.temporarilyUnassignedOtaku), week.onlineNewPublic])),
]);
writeCsv("online.csv", [
  ["stage", "seed", "week_end", "channel", "content_count", "impressions", "unique_reach", "new_to_team_reach", "repeat_reach", "existing_public_reach", "engagement_quality", "new_public_attributed", "week_new_public", "promotion_signal"],
  ...runs.flatMap(({ stage, result }) => result.onlineWeeks.flatMap((week) => week.channels.map((channel) => [stage, result.seed, week.weekEnd, channel.channel, channel.contentCount, channel.impressions, channel.uniqueReachEstimated, channel.newToTeamReachEstimated, channel.repeatReachEstimated, channel.existingPublicReachEstimated, channel.engagementQuality, channel.newPublicAttributed, week.newPublic, number(week.promotionSignal)]))),
]);
writeCsv("attribution.csv", [
  ["stage", "seed", "live_id", "date", "p_aware", "p_want", "p_ticketed", "p_attend", "p_active_attend", "p_other_attend", "x_configured_demand", "x_idol_attend", "x_general_attend", "p_to_o", "x_idol_to_o", "x_general_to_o", "x_to_o", "x_to_p"],
  ...runs.flatMap(({ stage, result }) => result.events.map((event) => {
    const a = event.audienceAttribution;
    return [stage, result.seed, event.liveId, event.date, a?.awarePublic ?? "", a ? a.publicDemand - a.referredPublicWatching : "", a?.ticketedPublic ?? event.fanFlow.publicAttendance, event.fanFlow.publicAttendance, a?.activeIntentPublicWatching ?? "", a?.referredPublicWatching ?? "", a?.configuredExternalDemand ?? "", a?.externalIdolWatching ?? "", a?.externalGeneralWatching ?? "", event.fanFlow.publicToOtaku, a?.externalIdolToOtaku ?? "", a?.externalGeneralToOtaku ?? "", event.fanFlow.externalToOtaku, event.fanFlow.externalToPublic];
  })),
]);
const detailRuns = runs.filter(({ result }) => result.seed === 1);
writeCsv("cheki-member.csv", [
  ["stage", "seed", "live_id", "date", "member_id", "tier", "requested_units", "completed_units", "buyers_served", "queue_lost_jpy", "gross_jpy", "member_share_jpy", "variable_cost_jpy"],
  ...detailRuns.flatMap(({ stage, result }) => result.events.flatMap((event) => Object.entries(event.cheki.queues).flatMap(([memberId, queue]) => ["1000", "2000"].map((tier) => {
    const line = event.cheki.lines.find((candidate) => candidate.memberId === memberId && candidate.tierId === tier);
    return [stage, result.seed, event.liveId, event.date, memberId, tier, queue.requestedUnits, queue.completedUnitsByTier[tier], queue.buyerCount, queue.queueLostJPY, line?.grossSales ?? 0, line?.memberShare ?? 0, line?.variableCost ?? 0];
  })))),
]);
writeCsv("finance.csv", [
  ["stage", "seed", "entry_id", "date", "kind", "amount_jpy", "category", "event_id", "member_id"],
  ...detailRuns.flatMap(({ stage, result }) => result.state.finance.entries.map((entry) => [stage, result.seed, entry.id, entry.date, entry.kind, entry.amount, entry.category, entry.eventId ?? "", entry.memberId ?? ""])),
]);
writeCsv("seeds.csv", [
  ["stage", "seed", "stage_status", "final_public", "final_otaku", "online_new_public", "public_ticketed_attendance", "p_to_o", "x_to_o", "final_cash_jpy", "performance_mean", "overall_grade"],
  ...runs.map(({ stage, result }) => [stage, result.seed, result.stageStatus, number(result.state.fan.publicCount), number(result.state.fan.otakuCount), onlinePublic(result), publicTicketed(result), publicToOtaku(result), externalToOtaku(result), result.state.finance.cash, number(mean(result.events.map((event) => event.performanceInternal))), result.grades.overall]),
]);

const summaries = stages.map((stage) => {
  const stageRuns = runs.filter((run) => run.stage === stage).map((run) => run.result);
  return {
    stage,
    seeds: stageRuns.length,
    finalP: mean(stageRuns.map((result) => result.state.fan.publicCount)),
    finalO: mean(stageRuns.map((result) => result.state.fan.otakuCount)),
    onlineP: mean(stageRuns.map(onlinePublic)),
    publicAttendance: mean(stageRuns.map(publicTicketed)),
    pToO: mean(stageRuns.map(publicToOtaku)),
    xToO: mean(stageRuns.map(externalToOtaku)),
    cash: mean(stageRuns.map((result) => result.state.finance.cash)),
    p10O: percentile(stageRuns.map((result) => result.state.fan.otakuCount), 0.1),
    p90O: percentile(stageRuns.map((result) => result.state.fan.otakuCount), 0.9),
  };
});
writeCsv("stage-summary.csv", [
  ["stage", "seeds", "mean_final_p", "mean_final_o", "mean_online_new_p", "mean_public_ticketed_attendance", "mean_p_to_o", "mean_x_to_o", "mean_final_cash_jpy", "p10_final_o", "p90_final_o"],
  ...summaries.map((row) => [row.stage, row.seeds, number(row.finalP), number(row.finalO), number(row.onlineP), number(row.publicAttendance), number(row.pToO), number(row.xToO), number(row.cash), number(row.p10O), number(row.p90O)]),
]);
const checks = Object.entries(failed).map(([id, rows]) => ({ id, pass: rows.length === 0, passedRuns: runs.length - rows.length, failedRuns: rows }));
fs.writeFileSync(path.join(output, "assertions.json"), `${JSON.stringify({ evaluatedSeeds: seeds, stages, checks }, null, 2)}\n`);
fs.writeFileSync(path.join(output, "config.json"), `${JSON.stringify({ commit, route: "B", s3Variant: "S3-C", stages, seeds, scenarioVersion: staffAutoplayScenarioV1.version, onlineTunables: staffOnlineAcquisitionV11, externalDemandTunables: staffExternalAudienceDemandV11, command: "npm run report:fan-acquisition-audience-demand" }, null, 2)}\n`);
const failures = checks.filter((check) => !check.pass);
fs.writeFileSync(path.join(output, "summary.md"), `# Fan Acquisition × Audience Demand v1.1 — C0–C3 paired Runtime audit\n\n- Runtime commit at generation: \`${commit}\`\n- Route: B / Staff default / S3-C; seeds 1–100 reused for every stage.\n- C0 legacy control; C1 adds only weekly SNS→P; C2 adds C1 plus P awareness/ticket demand and explicit X demand with legacy conversion candidates; C3 adds segmented active-P/P-other/X-idol/X-general conversion.\n- All values are emitted by the actual Runtime. No O target, fixed income, or invented capacity fill is used.\n\n## Mean results\n\n${summaries.map((row) => `- ${row.stage}: P ${number(row.finalP)}, O ${number(row.finalO)} (p10–p90 ${number(row.p10O)}–${number(row.p90O)}), online new P ${number(row.onlineP)}, P ticketed/attending ${number(row.publicAttendance)}, P→O ${number(row.pToO)}, X→O ${number(row.xToO)}, final cash ¥${number(row.cash)}.`).join("\n")}\n\n## Audit files\n\n- \`events.csv\`, \`weekly.csv\`, \`online.csv\`, and \`attribution.csv\` include all 400 Runtime runs.\n- \`cheki-member.csv\` and \`finance.csv\` retain the detailed seed-1 ledger for each stage; \`seeds.csv\` and \`stage-summary.csv\` carry all 100-seed outcomes.\n\n## Assertions\n\n${checks.map((check) => `- ${check.pass ? "PASS" : "FAIL"}: ${check.id} (${check.passedRuns}/${runs.length}); failed runs: ${check.failedRuns.join(", ") || "none"}`).join("\n")}\n\n${failures.length ? "At least one structural assertion failed; see assertions.json." : "All structural assertions passed."}\n\nO≈300 remains a calibration reference only, not an assertion or a parameter-selection target.\n`);
console.log(`Wrote ${path.relative(process.cwd(), output)}`);
