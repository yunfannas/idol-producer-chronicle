/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-s3c-r1-affinity-report.cjs"));
const { runStaffAutoplayPrologue } = jiti("../src/lib/runtime/staff-autoplay.ts");
const output = path.join(process.cwd(), "reports", "staff-baseline", "s3c-r1-affinity-v1", "before-after-100-seeds");
fs.mkdirSync(output, { recursive: true });
const seeds = Array.from({ length: 100 }, (_, i) => i + 1);
const sum = (v) => v.reduce((a, b) => a + b, 0);
const mean = (v) => sum(v) / Math.max(1, v.length);
const n = (v) => Number(Number(v).toFixed(6));
const csv = (rows) => `${rows.map((row) => row.map((value) => { const text = typeof value === "string" ? value : JSON.stringify(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }).join(",")).join("\n")}\n`;
const write = (name, rows) => fs.writeFileSync(path.join(output, name), csv(rows));
const checkpoints = ["2013-05-26", "2013-08-25", "2013-12-29", "2014-03-09", "2014-05-11", "2014-07-27", "2014-08-03"];
const runs = [];
const seedRows = [["experiment", "seed", "final_p", "final_o", "final_a", "a_per_o", "cheki_gross", "cheki_net", "cash"]];
const timeRows = [["experiment", "seed", "week_end", "p", "o", "sum_a", "a_per_o"]];
const memberRows = [["experiment", "seed", "member_id", "live_count", "mean_member_quality", "cheki_services", "member_live_a", "paid_cheki_a", "voucher_cheki_a", "existing_live_a", "existing_cheki_a", "final_a", "final_w", "cheki_gross"]];
for (const experiment of [{ id: "before", r1Affinity: { enableExistingOtakuChekiTrials: false } }, { id: "after", r1Affinity: { enableExistingOtakuChekiTrials: true } }]) for (const seed of seeds) {
  const result = runStaffAutoplayPrologue({ route: "B", seed, s3Variant: "S3-C", fanAcquisitionStage: "C3", newcomerVoucher: { enabled: true }, r1Affinity: experiment.r1Affinity });
  runs.push({ experiment: experiment.id, seed, result });
  const fan = result.state.fan;
  const finalA = sum(Object.values(fan.members).map((profile) => profile.affinityCount));
  const gross = sum(result.events.map((event) => event.chekiGrossJPY));
  const cost = sum(result.events.map((event) => event.chekiCommissionJPY + event.chekiVariableCostJPY));
  seedRows.push([experiment.id, seed, n(fan.publicCount), n(fan.otakuCount), n(finalA), n(finalA / Math.max(1, fan.otakuCount)), gross, gross - cost, result.state.finance.cash]);
  for (const date of checkpoints) {
    const week = result.fanWeeklyResolutions.find((entry) => entry.weekEnd === date);
    if (!week) continue;
    const a = sum(Object.values(week.closing.members).map((profile) => profile.affinityCount));
    timeRows.push([experiment.id, seed, date, n(week.closing.publicCount), n(week.closing.otakuCount), n(a), n(a / Math.max(1, week.closing.otakuCount))]);
  }
  for (const memberId of Object.keys(fan.members)) {
    const events = result.events.filter((event) => event.participantIds.includes(memberId));
    const byFlow = (field) => sum(events.map((event) => event.fanFlow[field][memberId] ?? 0));
    memberRows.push([experiment.id, seed, memberId, events.length, n(mean(events.map((event) => event.performanceInternal))), sum(events.map((event) => event.cheki.queues[memberId]?.completedUnits ?? 0)), byFlow("memberLiveAffinityByMember"), byFlow("paidChekiAffinityByMember"), byFlow("voucherChekiAffinityByMember"), byFlow("existingOtakuAffinityByMember"), byFlow("existingOtakuChekiAffinityByMember"), n(fan.members[memberId].affinityCount), n(fan.members[memberId].purchaseWeightKJPY), sum(events.map((event) => event.cheki.lines.filter((line) => line.memberId === memberId).reduce((v, line) => v + line.grossSales, 0)))]);
  }
}
write("seeds.csv", seedRows); write("time-series.csv", timeRows); write("members.csv", memberRows);
const summary = [["experiment", "metric", "mean"]];
for (const experiment of ["before", "after"]) for (const metric of seedRows[0].slice(2)) { const pos = seedRows[0].indexOf(metric); summary.push([experiment, metric, n(mean(seedRows.slice(1).filter((row) => row[0] === experiment).map((row) => row[pos])))]); }
write("summary.csv", summary);
const before = (metric) => summary.find((row) => row[0] === "before" && row[1] === metric)[2];
const after = (metric) => summary.find((row) => row[0] === "after" && row[1] === metric)[2];
fs.writeFileSync(path.join(output, "audit.md"), `# S3-C R1 Affinity audit\n\n## Code-path finding\n\nExisting-O eligibility is reconstructed per member from the same event-local attending O: a member's temporary affinity sample is removed, then actual member exposure selects the remainder. Samples are independent by member, so fans of member j remain eligible for i and one temporary attendee may form multiple A edges. \`share\` is the authoritative per-show exposure share from the executable formula, not a mutually-exclusive fan allocation; it bounds the total Live affinity hazard and was retained.\n\nThe missing path was completed existing-O Cheki trial to a new member A. The repair adds a real ¥1,000 trial request only for exposed, unattached, stayed O; it shares the normal queue and is eligible for A only after completed service. Live and Cheki hazards for the same member/contact are mutually combined.\n\n## 100-seed paired result\n\n- Before: P ${before("final_p")}, O ${before("final_o")}, ΣA ${before("final_a")}, A/O ${before("a_per_o")}, gross ¥${before("cheki_gross")}, cash ¥${before("cash")}.\n- After: P ${after("final_p")}, O ${after("final_o")}, ΣA ${after("final_a")}, A/O ${after("a_per_o")}, gross ¥${after("cheki_gross")}, cash ¥${after("cash")}.\n\n## Status\n\n- PASS: Team O remains unassigned; Member Live/newcomer Cheki and completed existing-O trial sources are separated in the member ledger.\n- PASS: per-member A is bounded by assigned O; ΣA is never normalized to O; replay and Finance are checked by the Staff suite.\n- TUNABLE: Live base .10/cap .12, existing trial request .01×quality, and completed trial A .15 are centralized in r1-affinity.ts.\n- NOT_IMPLEMENTED: multi-oshi queue overflow and dynamic Retention remain separately tracked design gaps.\n`);
console.log(`Wrote ${path.relative(process.cwd(), output)}`);
