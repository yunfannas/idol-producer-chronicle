/* eslint-disable @typescript-eslint/no-require-imports */
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-s3c-r0-conversion-report.cjs"));
const { runStaffAutoplayPrologue, r0ConversionDefaultV1 } = jiti("../src/lib/runtime/staff-autoplay.ts");
const { r0DynamicConversionV1, legacyFixedConversionParameters } = jiti("../src/lib/runtime/fan-conversion.ts");

const output = path.join(process.cwd(), "reports", "staff-baseline", "s3c-r0-conversion-v1", "a-e-100-seeds");
fs.mkdirSync(output, { recursive: true });
const seeds = Array.from({ length: 100 }, (_, index) => index + 1);
const experiments = [
  { id: "A", name: "Legacy C3 baseline", input: { r0Conversion: { enabled: false } } },
  { id: "B", name: "R0 dynamic Team/Member Live", input: { r0Conversion: { enabled: true, enablePaidCheki: false, enableVoucherCheki: false, enableExternalLive: false } } },
  { id: "C", name: "B + completed paid Cheki", input: { r0Conversion: { enabled: true, enablePaidCheki: true, enableVoucherCheki: false, enableExternalLive: false } } },
  { id: "D", name: "C + completed newcomer vouchers", input: { r0Conversion: { enabled: true, enablePaidCheki: true, enableVoucherCheki: true, enableExternalLive: false }, newcomerVoucher: { enabled: true } } },
  { id: "E", name: "D + X Team/Member Live and weekly exposure", input: { r0Conversion: { enabled: true, enablePaidCheki: true, enableVoucherCheki: true, enableExternalLive: true }, newcomerVoucher: { enabled: true } } },
];
const sourceCommit = childProcess.execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const number = (value) => Number(Number(value).toFixed(6));
const sum = (items) => items.reduce((total, value) => total + value, 0);
const mean = (items) => sum(items) / Math.max(1, items.length);
const percentile = (items, p) => { const ordered = [...items].sort((a, b) => a - b); return ordered[Math.round((ordered.length - 1) * p)]; };
const csv = (rows) => `${rows.map((row) => row.map((value) => { const text = typeof value === "string" ? value : JSON.stringify(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }).join(",")).join("\n")}\n`;
const write = (name, rows) => fs.writeFileSync(path.join(output, name), Array.isArray(rows) ? csv(rows) : `${JSON.stringify(rows, null, 2)}\n`);
const eventRows = [["experiment", "seed", "date", "live_id", "kind", "attendance", "public_attendance", "team_source_public_attendance", "member_source_public_attendance", "x_idol_attendance", "x_general_attendance", "team_source_external_attendance", "member_source_external_attendance", "team_live_to_o", "member_live_to_o", "paid_cheki_to_o", "voucher_cheki_to_o", "x_to_o", "external_exposure", "initial_affinity_by_member", "paid_newcomer_requested", "paid_newcomer_served", "voucher_requested", "voucher_served", "ticket_revenue_jpy", "cheki_gross_jpy"]];
const weekRows = [["experiment", "seed", "week_end", "opening_p", "opening_o", "sns_new_p", "song_new_p", "work_new_p", "taiban_new_p", "free_live_new_p", "other_live_new_p", "team_live_to_o", "member_live_to_o", "paid_cheki_to_o", "voucher_cheki_to_o", "x_idol_to_o", "x_general_to_o", "public_churn", "otaku_churn", "graduation_loss", "closing_p", "closing_o"]];
const attributionRows = [["experiment", "seed", "live_id", "p_active", "p_referred", "x_idol", "x_general", "legacy_p_to_o", "legacy_x_idol_to_o", "legacy_x_general_to_o", "r0_team_live_to_o", "r0_member_live_to_o", "r0_paid_cheki_to_o", "r0_voucher_cheki_to_o"]];
const chekiRows = [["experiment", "seed", "live_id", "member_id", "paid_newcomer_requested", "paid_newcomer_served", "paid_newcomer_lost", "voucher_requested", "voucher_served", "voucher_lost", "paid_units", "gross_jpy", "queue_lost_jpy", "new_initial_affinity"]];
const financeRows = [["experiment", "seed", "entry_id", "date", "kind", "amount_jpy", "category", "event_id", "member_id"]];
const seedRows = [["experiment", "seed", "final_p", "final_o", "p_plus_o", "team_live_to_o", "member_live_to_o", "paid_cheki_to_o", "voucher_cheki_to_o", "x_to_o", "sns_new_p", "event_new_p", "public_churn", "otaku_churn", "affinity_total", "one_man_attendance", "one_man_ticket_revenue", "cheki_services", "cheki_gross", "final_cash"]];
const compact = new Map();
const failures = { population_conservation: [], source_and_capacity: [], one_o_per_event: [], completed_service_only: [], queue: [], free_revenue: [], finance: [], graduation: [], replay: [], tif: [] };
const totals = (result) => {
  const weeks = result.fanWeeklyResolutions;
  const events = result.events;
  const oneMan = events.find((event) => event.kind === "one-man");
  return {
    finalP: result.state.fan.publicCount, finalO: result.state.fan.otakuCount, population: result.state.fan.publicCount + result.state.fan.otakuCount,
    team: sum(weeks.map((week) => week.teamLiveToOtaku)), member: sum(weeks.map((week) => week.memberLiveToOtaku)), paid: sum(weeks.map((week) => week.paidChekiToOtaku)), voucher: sum(weeks.map((week) => week.voucherChekiToOtaku)), x: sum(weeks.map((week) => week.externalToOtaku)),
    sns: sum(weeks.map((week) => week.snsNewPublic)), eventP: sum(weeks.map((week) => week.eventExposureNewPublic)), pChurn: sum(weeks.map((week) => week.publicChurn)), oChurn: sum(weeks.map((week) => week.otakuChurn)),
    affinity: sum(Object.values(result.state.fan.members).map((member) => member.affinityCount)), oneManAttendance: oneMan?.actualAttendance ?? 0, oneManTicket: oneMan?.ticketRevenueJPY ?? 0,
    chekiServices: sum(events.map((event) => Object.values(event.cheki.queues).reduce((value, queue) => value + queue.completedUnits, 0))), chekiGross: sum(events.map((event) => event.chekiGrossJPY)), cash: result.state.finance.cash,
  };
};
const signature = (result) => JSON.stringify({ fan: result.state.fan, cash: result.state.finance.cash, finance: result.state.finance.entries.map((entry) => entry.id), events: result.events.map((event) => [event.liveId, event.actualAttendance, event.fanFlow]) });
for (const experiment of experiments) for (const seed of seeds) {
  const input = { route: "B", seed, s3Variant: "S3-C", fanAcquisitionStage: "C3", ...experiment.input };
  const result = runStaffAutoplayPrologue(input);
  const stat = totals(result);
  compact.set(`${experiment.id}:${seed}`, stat);
  seedRows.push([experiment.id, seed, number(stat.finalP), number(stat.finalO), number(stat.population), stat.team, stat.member, stat.paid, stat.voucher, stat.x, stat.sns, stat.eventP, number(stat.pChurn), number(stat.oChurn), number(stat.affinity), stat.oneManAttendance, stat.oneManTicket, stat.chekiServices, stat.chekiGross, stat.cash]);
  for (const event of result.events) {
    const a = event.audienceAttribution;
    const queues = Object.values(event.cheki.queues);
    eventRows.push([experiment.id, seed, event.date, event.liveId, event.kind, event.actualAttendance, event.fanFlow.publicAttendance, event.fanFlow.teamSourcePublicAttendance, event.fanFlow.memberSourcePublicAttendance, a?.externalIdolWatching ?? 0, a?.externalGeneralWatching ?? 0, event.fanFlow.teamSourceExternalAttendance, event.fanFlow.memberSourceExternalAttendance, event.fanFlow.teamLiveToOtaku, event.fanFlow.memberLiveToOtaku, event.fanFlow.paidChekiToOtaku, event.fanFlow.voucherChekiToOtaku, event.fanFlow.externalToOtaku, event.fanFlow.externalExposure, JSON.stringify(event.fanFlow.initialAffinityByMember), sum(queues.map((queue) => queue.paidNewcomerRequested)), sum(queues.map((queue) => queue.paidNewcomerServed)), event.fanFlow.freeTrialRequested, event.fanFlow.freeTrialServed, event.ticketRevenueJPY, event.chekiGrossJPY]);
    attributionRows.push([experiment.id, seed, event.liveId, a?.activeIntentPublicWatching ?? 0, a?.referredPublicWatching ?? 0, a?.externalIdolWatching ?? 0, a?.externalGeneralWatching ?? 0, a?.publicToOtaku ?? 0, a?.externalIdolToOtaku ?? 0, a?.externalGeneralToOtaku ?? 0, event.fanFlow.teamLiveToOtaku, event.fanFlow.memberLiveToOtaku, event.fanFlow.paidChekiToOtaku, event.fanFlow.voucherChekiToOtaku]);
    for (const [memberId, queue] of Object.entries(event.cheki.queues)) chekiRows.push([experiment.id, seed, event.liveId, memberId, queue.paidNewcomerRequested, queue.paidNewcomerServed, queue.paidNewcomerLost, queue.freeTrialRequested, queue.freeTrialServed, queue.freeTrialLost, queue.completedUnits, event.cheki.lines.filter((line) => line.memberId === memberId).reduce((value, line) => value + line.grossSales, 0), queue.queueLostJPY, event.fanFlow.initialAffinityByMember[memberId] ?? 0]);
  }
  for (const week of result.fanWeeklyResolutions) weekRows.push([experiment.id, seed, week.weekEnd, number(week.opening.publicCount), number(week.opening.otakuCount), week.snsNewPublic, week.songNewPublic, week.workNewPublic, week.taibanExposureNewPublic, week.freeLiveExposureNewPublic, week.otherLiveExposureNewPublic, week.teamLiveToOtaku, week.memberLiveToOtaku, week.paidChekiToOtaku, week.voucherChekiToOtaku, week.externalIdolToOtaku, week.externalGeneralToOtaku, number(week.publicChurn), number(week.otakuChurn), week.graduationLoss, number(week.closing.publicCount), number(week.closing.otakuCount)]);
  for (const entry of result.state.finance.entries) financeRows.push([experiment.id, seed, entry.id, entry.date, entry.kind, entry.amount, entry.category, entry.eventId ?? "", entry.memberId ?? ""]);
  const key = `${experiment.id}:${seed}`; const eps = 1e-9;
  if (result.fanWeeklyResolutions.some((week) => Math.abs(week.closing.publicCount - (week.opening.publicCount + week.newPublic - week.publicToOtaku - week.publicChurn)) > eps || Math.abs(week.closing.otakuCount - (week.opening.otakuCount + week.publicToOtaku + week.externalToOtaku - week.otakuChurn - week.graduationLoss)) > eps)) failures.population_conservation.push(key);
  if (result.events.some((event) => event.fanFlow.otakuAttendance + event.fanFlow.publicAttendance + event.fanFlow.externalAudience !== event.actualAttendance || event.actualAttendance > event.audienceCapacity)) failures.source_and_capacity.push(key);
  if (result.events.some((event) => event.fanFlow.publicToOtaku > event.fanFlow.publicAttendance || event.fanFlow.externalToOtaku + event.fanFlow.externalExposure !== event.fanFlow.externalAudience || (result.effectiveFanFlowConfig.r0Conversion.enabled && event.fanFlow.teamLiveToOtaku + event.fanFlow.memberLiveToOtaku + event.fanFlow.paidChekiToOtaku + event.fanFlow.voucherChekiToOtaku !== event.fanFlow.publicToOtaku + event.fanFlow.externalToOtaku) || event.fanFlow.initialAffinityByMember && Object.values(event.fanFlow.initialAffinityByMember).reduce((value, count) => value + count, 0) > event.fanFlow.publicToOtaku + event.fanFlow.externalToOtaku)) failures.one_o_per_event.push(key);
  if (result.events.some((event) => event.fanFlow.paidChekiToOtaku > Object.values(event.cheki.queues).reduce((value, queue) => value + queue.paidNewcomerServed, 0) || event.fanFlow.voucherChekiToOtaku > event.fanFlow.freeTrialServed || Object.values(event.fanFlow.freeTrialConversionsByMember).reduce((value, count) => value + count, 0) > event.fanFlow.freeTrialServed || Object.values(event.cheki.queues).some((queue) => queue.paidNewcomerServed > queue.paidNewcomerRequested || queue.freeTrialServed > queue.freeTrialRequested))) failures.completed_service_only.push(key);
  if (result.events.some((event) => Object.values(event.cheki.queues).some((queue) => queue.completedUnits > queue.requestedUnits || queue.completedUnitsByTier["1000"] + queue.completedUnitsByTier["2000"] !== queue.completedUnits))) failures.queue.push(key);
  if (result.events.filter((event) => event.kind === "free-mall").some((event) => event.ticketRevenueJPY || event.chekiGrossJPY || event.chekiCommissionJPY)) failures.free_revenue.push(key);
  const expectedCash = 3_000_000 + result.state.finance.operatingRevenue - result.state.finance.operatingCost - result.state.finance.capitalizedAssets + result.state.finance.loans;
  if (result.state.finance.cash !== expectedCash || new Set(result.state.finance.entries.map((entry) => entry.id)).size !== result.state.finance.entries.length) failures.finance.push(key);
  if (result.events.filter((event) => event.date > "2014-05-11").some((event) => event.participantIds.includes("IPC1-001") || event.cheki.queues["IPC1-001"] || event.fanFlow.initialAffinityByMember["IPC1-001"])) failures.graduation.push(key);
  if (result.stageStatus !== "COMPLETED_TIF") failures.tif.push(key);
  if (signature(runStaffAutoplayPrologue(input)) !== signature(result)) failures.replay.push(key);
}
write("events.csv", eventRows); write("weekly.csv", weekRows); write("attribution.csv", attributionRows); write("cheki-member.csv", chekiRows); write("finance.csv", financeRows); write("seeds.csv", seedRows);
const metrics = ["finalP", "finalO", "population", "team", "member", "paid", "voucher", "x", "sns", "eventP", "pChurn", "oChurn", "affinity", "oneManAttendance", "oneManTicket", "chekiServices", "chekiGross", "cash"];
const summaryRows = [["experiment", "name", "metric", "mean", "p10", "p50", "p90"]];
for (const experiment of experiments) for (const metric of metrics) { const values = seeds.map((seed) => compact.get(`${experiment.id}:${seed}`)[metric]); summaryRows.push([experiment.id, experiment.name, metric, number(mean(values)), number(percentile(values, .1)), number(percentile(values, .5)), number(percentile(values, .9))]); }
write("experiment-summary.csv", summaryRows);
const deltaRows = [["experiment", "metric", "mean_delta_vs_a", "p10", "p50", "p90"]];
for (const experiment of experiments.slice(1)) for (const metric of metrics) { const values = seeds.map((seed) => compact.get(`${experiment.id}:${seed}`)[metric] - compact.get(`A:${seed}`)[metric]); deltaRows.push([experiment.id, metric, number(mean(values)), number(percentile(values, .1)), number(percentile(values, .5)), number(percentile(values, .9))]); }
write("paired-deltas.csv", deltaRows);
const checks = Object.entries(failures).map(([id, failedRuns]) => ({ id, pass: failedRuns.length === 0, checkedRuns: 500, failedRuns }));
write("assertions.json", { seeds, experiments: experiments.map(({ id, name }) => ({ id, name })), checks });
write("effective-config.json", { sourceCommit, r0Default: r0ConversionDefaultV1, r0Tunables: r0DynamicConversionV1, legacyFixedParameters: legacyFixedConversionParameters, experiments, command: "npm run report:s3c-r0-conversion" });
const lookup = (experiment, metric) => summaryRows.find((row) => row[0] === experiment && row[2] === metric)[3];
const delta = (experiment, metric) => deltaRows.find((row) => row[0] === experiment && row[1] === metric)[2];
fs.writeFileSync(path.join(output, "r0-audit.md"), `# S3-C R0 dynamic conversion audit\n\n## Actual path\n\nC3 calls \`resolveDiagnosticAudienceChannels\` only for demand/population attribution, with \`skipLegacyConversion=true\`. It then calls \`updateFanFromR0Event\`: actual Team quality and member quality become satisfaction; R0 samples Team Live, Member Live, then only completed paid/voucher services. Event momentum writes P/O once at Sunday. The legacy \`activePublicToOtakuRate\` and \`pPublicToOtaku*q\` paths remain available only when R0 is explicitly disabled for A/C0/C2 comparison.\n\n- Baseline active fixed rate is not used by R0; legacy values: \`${JSON.stringify(legacyFixedConversionParameters)}\`.\n- Team conversions add O only; Member Live/Cheki conversions add O plus the actual source/service member A. Event-local source members are neutral across actual participants because no approved Member-Appeal acquisition input is wired; actual Member Performance is applied once in its conversion/satisfaction curve.\n- Unconverted X enters only the Sunday exposure pool. No persistent fan ID/cohort was added.\n\n## A–E mean results\n\n${experiments.map((experiment) => `- ${experiment.id} ${experiment.name}: P ${lookup(experiment.id, "finalP")}, O ${lookup(experiment.id, "finalO")}, P+O ${lookup(experiment.id, "population")}, Team/Member/Paid/Voucher/X→O ${lookup(experiment.id, "team")}/${lookup(experiment.id, "member")}/${lookup(experiment.id, "paid")}/${lookup(experiment.id, "voucher")}/${lookup(experiment.id, "x")}, cash ¥${lookup(experiment.id, "cash")}.`).join("\n")}\n\n## Paired marginal results\n\n${experiments.slice(1).map((experiment) => `- ${experiment.id} vs A: ΔP ${delta(experiment.id, "finalP")}, ΔO ${delta(experiment.id, "finalO")}, ΔP+O ${delta(experiment.id, "population")}, Δcash ¥${delta(experiment.id, "cash")}.`).join("\n")}\n\n## Assertions\n\n${checks.map((check) => `- ${check.pass ? "PASS" : "FAIL"}: ${check.id} (${check.checkedRuns - check.failedRuns.length}/${check.checkedRuns})`).join("\n")}\n\nAll raw event, weekly, attribution, queue, finance, seed, distribution, and paired-delta files are colocated in this directory.\n`);
console.log(`Wrote ${path.relative(process.cwd(), output)}`);
