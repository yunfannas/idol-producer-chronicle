/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * C3 one-variable calibration. Calls actual Chronicle Staff Runtime, never an
 * independent growth model. Run: node scripts/calibrate-c3-active-public-conversion.cjs
 * This script must be executed in a checkout with installed dependencies.
 */
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "calibrate-c3-active-public-conversion.cjs"));
const { runStaffAutoplayPrologue } = jiti("../src/lib/runtime/staff-autoplay.ts");
const { audienceChannelDiagnosticV1 } = jiti("../src/lib/runtime/audience-channels.ts");
const rates = [0.10, 0.15, 0.20, 0.25, 0.35];
const seeds = Array.from({length:100},(_,i)=>i+1);
const out = path.join(process.cwd(),"reports","staff-baseline","fan-acquisition-audience-demand-v1.1","c3-active-public-conversion-100-seeds");
fs.mkdirSync(out,{recursive:true});
const revision = cp.execSync("git rev-parse HEAD",{encoding:"utf8"}).trim();
const base={...audienceChannelDiagnosticV1};
const avg=x=>x.reduce((a,b)=>a+b,0)/x.length;
const round=x=>Number(x.toFixed(6));
const pct=(xs,p)=>{const a=[...xs].sort((x,y)=>x-y);return a[Math.round((a.length-1)*p)]};
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const quote=x=>{let t=typeof x==="string"?x:JSON.stringify(x??"");return /[",\n]/.test(t)?'"'+t.replaceAll('"','""')+'"':t};
const csv=(name,header,rows)=>fs.writeFileSync(path.join(out,name),[header,...rows].map(r=>r.map(quote).join(",")).join("\n")+"\n");
const runs=[];
const failures=[];
for(const rate of rates){
  for(const seed of seeds){
    const args={route:"B",seed,s3Variant:"S3-C",fanAcquisitionStage:"C3",audienceDemand:{channelConfig:{activePublicToOtakuRate:rate}}};
    const r=runStaffAutoplayPrologue(args);
    runs.push({rate,seed,r});
    const f=[];
    if(r.stageStatus!=="COMPLETED_TIF") f.push("tif");
    if(r.events.some(e=>e.fanFlow.otakuAttendance+e.fanFlow.publicAttendance+e.fanFlow.externalAudience!==e.actualAttendance||e.actualAttendance>e.audienceCapacity))f.push("capacity");
    if(r.fanWeeklyResolutions.some(w=>w.closing.publicCount<0||w.closing.otakuCount<0||w.closing.temporarilyUnassignedOtaku>w.closing.otakuCount||Object.values(w.closing.members).some(m=>m.affinityCount<0||m.affinityCount>w.closing.otakuCount-w.closing.temporarilyUnassignedOtaku)))f.push("fan");
    if(r.events.some(e=>e.audienceAttribution==null||e.audienceAttribution.activePublicToOtaku>e.audienceAttribution.activeIntentPublicWatching||e.fanFlow.publicToOtaku!==e.audienceAttribution.publicToOtaku))f.push("conversion");
    const fin=r.state.finance;
    if(new Set(fin.entries.map(e=>e.id)).size!==fin.entries.length||fin.cash!==3000000+fin.operatingRevenue-fin.operatingCost-fin.capitalizedAssets+fin.loans)f.push("finance");
    if(r.events.filter(e=>e.date>"2014-05-11").some(e=>e.participantIds.includes("IPC1-001")||e.cheki.queues["IPC1-001"]||e.fanFlow.initialAffinityByMember["IPC1-001"]))f.push("graduation");
    if(JSON.stringify(runStaffAutoplayPrologue(args))!==JSON.stringify(r))f.push("replay");
    if(f.length)failures.push({rate,seed,checks:f});
  }
}
const getPaid=r=>sum(r.events.map(e=>e.chekiGrossJPY));
const getPTickets=r=>sum(r.events.map(e=>e.audienceAttribution?.ticketedPublic??0));
const getPConverted=r=>sum(r.events.map(e=>e.fanFlow.publicToOtaku));
const getActiveConverted=r=>sum(r.events.map(e=>e.audienceAttribution?.activePublicToOtaku??0));
const getActiveViewed=r=>sum(r.events.map(e=>e.audienceAttribution?.activeIntentPublicWatching??0));
const getExternalConverted=r=>sum(r.events.map(e=>e.fanFlow.externalToOtaku));
const sumAff=r=>sum(Object.values(r.state.fan.members).map(m=>m.affinityCount));
const income=r=>r.state.finance.operatingRevenue;
const expense=r=>r.state.finance.operatingCost;
const memberIds=[...new Set(runs.flatMap(({r})=>Object.keys(r.state.fan.members)))].sort();
const checkpoints=[["debut","2013-05-24"],["free_mall","2013-09-29"],["trial_regular","2014-02-28"],["weekly_regular","2014-04-30"],["graduation","2014-05-11"],["pre_one_man","2014-07-26"],["tif","2014-08-02"]];
const at=(r,date)=>{const weeks=r.fanWeeklyResolutions.filter(w=>w.weekEnd.slice(0,10)<=date);if(weeks.length)return weeks.at(-1).closing;return r.fanWeeklyResolutions[0].opening};
csv("seeds.csv",["rate","seed","status","final_P","final_O","final_U","sum_A","online_new_P","P_ticketed_attendance","active_P_attendance","active_P_to_O","all_P_to_O","X_to_O","cheki_gross_jpy","operating_revenue_jpy","operating_cost_jpy","final_cash_jpy"],runs.map(({rate,seed,r})=>[rate,seed,r.stageStatus,round(r.state.fan.publicCount),round(r.state.fan.otakuCount),round(r.state.fan.temporarilyUnassignedOtaku),round(sumAff(r)),sum(r.onlineWeeks.map(w=>w.newPublic)),getPTickets(r),getActiveViewed(r),getActiveConverted(r),getPConverted(r),getExternalConverted(r),getPaid(r),income(r),expense(r),r.state.finance.cash]));
csv("members.csv",["rate","seed","member_id","A","W_KJPY"],runs.flatMap(({rate,seed,r})=>memberIds.map(id=>[rate,seed,id,round(r.state.fan.members[id]?.affinityCount??0),round(r.state.fan.members[id]?.purchaseWeightKJPY??0)])));
csv("checkpoints.csv",["rate","seed","checkpoint","cutoff","P","O","U","sum_A"],runs.flatMap(({rate,seed,r})=>checkpoints.map(([name,date])=>{const fan=at(r,date);return [rate,seed,name,date,round(fan.publicCount),round(fan.otakuCount),round(fan.temporarilyUnassignedOtaku),round(sum(Object.values(fan.members).map(m=>m.affinityCount)))];})));
csv("events.csv",["rate","seed","date","live_id","kind","P_aware","P_ticketed","P_active_viewers","P_active_to_O","P_all_to_O","X_to_O","cheki_gross_jpy","cash_after_jpy"],runs.flatMap(({rate,seed,r})=>r.events.map(e=>[rate,seed,e.date,e.liveId,e.kind,e.audienceAttribution?.awarePublic??"",e.audienceAttribution?.ticketedPublic??"",e.audienceAttribution?.activeIntentPublicWatching??"",e.audienceAttribution?.activePublicToOtaku??"",e.fanFlow.publicToOtaku,e.fanFlow.externalToOtaku,e.chekiGrossJPY,e.cashAfterJPY])));
const stats=runs.length&&rates.map(rate=>{const a=runs.filter(x=>x.rate===rate).map(x=>x.r);return {rate,seeds:a.length,P:round(avg(a.map(r=>r.state.fan.publicCount))),O:round(avg(a.map(r=>r.state.fan.otakuCount))),O_p10:round(pct(a.map(r=>r.state.fan.otakuCount),.1)),O_p90:round(pct(a.map(r=>r.state.fan.otakuCount),.9)),U:round(avg(a.map(r=>r.state.fan.temporarilyUnassignedOtaku))),sum_A:round(avg(a.map(sumAff))),P_attendance:round(avg(a.map(getPTickets))),active_P_attendance:round(avg(a.map(getActiveViewed))),active_P_to_O:round(avg(a.map(getActiveConverted))),all_P_to_O:round(avg(a.map(getPConverted))),X_to_O:round(avg(a.map(getExternalConverted))),cheki_gross_jpy:round(avg(a.map(getPaid))),operating_revenue_jpy:round(avg(a.map(income))),operating_cost_jpy:round(avg(a.map(expense))),cash_jpy:round(avg(a.map(r=>r.state.finance.cash)))}});
csv("summary.csv",Object.keys(stats[0]),stats.map(s=>Object.values(s)));
const config={runtimeCommit:revision,route:"B",s3Variant:"S3-C",fanAcquisitionStage:"C3",seeds,rates,changedField:"audienceDemand.channelConfig.activePublicToOtakuRate",referenceRate:base.activePublicToOtakuRate,allOtherFields:"Inherited unchanged from audienceChannelDiagnosticV1 and Staff Runtime"};
fs.writeFileSync(path.join(out,"config.json"),JSON.stringify(config,null,2)+"\n");
fs.writeFileSync(path.join(out,"assertions.json"),JSON.stringify({runs:runs.length,passed:runs.length-failures.length,failures},null,2)+"\n");
const summary=["# Chronicle C3 active Public conversion — actual Runtime 100-seed sweep","",`- Runtime commit: \`${revision}\``, "- B/S3-C, C3 only. All five groups use seeds 1–100; only activePublicToOtakuRate changes.","- Current/reference candidate 0.35; requested candidate 0.10.","- Non-conversion mechanics use the same Runtime and parameters; no independent Python population model.","", "|Rate|P|O (p10–p90)|P attendance|P→O|ΣA|Cheki gross|Cash|","|---|---:|---:|---:|---:|---:|---:|---:|",...stats.map(x=>`|${x.rate}|${x.P}|${x.O} (${x.O_p10}–${x.O_p90})|${x.P_attendance}|${x.all_P_to_O}|${x.sum_A}|¥${x.cheki_gross_jpy}|¥${x.cash_jpy}|`),"",`- Structural + replay failures: ${failures.length} / ${runs.length}.`,"- See seeds.csv, events.csv, members.csv, checkpoints.csv, assertions.json and config.json.","- Checkpoint states are taken from the latest *weekly* closure not after each individual event; graduation/one-man boundary dates may be between weekly settlements.","- Do not select a rate only by proximity to O≈300. Assess staged growth, attendance/unique-source assumptions and A distribution."];fs.writeFileSync(path.join(out,"summary.md"),summary.join("\n")+"\n");
if(failures.length){process.stderr.write(`Failed ${failures.length} run(s). Check assertions.json\n`);process.exitCode=1}else process.stdout.write(`Completed ${runs.length} Chronicle Runtime runs. Reports in ${out}\n`);
