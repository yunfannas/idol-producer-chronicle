import { describe, expect, it } from "vitest";
import { runStaffAutoplayPrologue } from "./staff-autoplay";

describe("Staff autoplay prologue E2E", () => {
  it("runs B seed 1 through the immutable TIF event with real kernels and a reconcilable ledger", () => {
    const result = runStaffAutoplayPrologue({ route: "B", seed: 1 });
    expect(result.stageStatus).not.toBe("BLOCKED_BUG");
    expect(result.events.at(-1)?.liveId).toBe("tif-2014-08-02");
    expect(result.fanWeeklyResolutions.some((week) => week.weekEnd === "2014-08-02:chapter-close" && week.eventIds.includes("tif-2014-08-02"))).toBe(true);
    expect(result.fanMonths.at(-1)?.closing.otakuCount).toBe(result.state.fan.otakuCount);
    expect(result.events.every((event) => Number.isFinite(event.performanceInternal))).toBe(true);
    expect(result.events.find((event) => event.liveId === "debut-2013-05-24")?.ticketRevenueJPY).toBe(0);
    expect(result.events.find((event) => event.liveId === "mall-2013-09-29")?.chekiGrossJPY).toBe(0);
    expect(result.events.find((event) => event.liveId === "debut-2013-05-24")?.fanFlow.opening.otakuCount).toBeGreaterThan(20);
    expect(result.events.find((event) => event.liveId === "debut-2013-05-24")?.fanFlow.opening.members["IPC1-001"].affinityCount).toBeGreaterThan(10);
    expect(result.events.filter((event) => event.kind === "regular")).toHaveLength(22);
    expect(result.events.filter((event) => event.date === "2014-04-16")).toHaveLength(1);
    expect(result.events.some((event) => event.liveId === "regular-2014-06-25")).toBe(true);
    expect(result.events.some((event) => event.liveId === "taiban-2014-06-26")).toBe(true);
    expect(result.state.members.find((member) => member.id === "IPC1-001")?.active).toBe(false);
    expect(result.events.filter((event) => event.date > "2014-05-11").every((event) => !event.participantIds.includes("IPC1-001"))).toBe(true);
    expect(result.state.finance.cash).toBe(
      3_000_000 + result.state.finance.operatingRevenue - result.state.finance.operatingCost - result.state.finance.capitalizedAssets + result.state.finance.loans,
    );
    expect(runStaffAutoplayPrologue({ route: "B", seed: 1 })).toEqual(result);
  });

  it("attributes Public conversions to actual event viewers including TIF chapter close", () => {
    const result = runStaffAutoplayPrologue({ route: "B", seed: 1 });
    expect(result.events.every((event) => event.fanFlow.publicToOtaku >= 0
      && event.fanFlow.publicToOtaku <= event.fanFlow.publicAttendance)).toBe(true);
    const attributed = result.events.reduce((sum, event) => sum + event.fanFlow.publicToOtaku, 0);
    const resolved = result.fanWeeklyResolutions.reduce((sum, week) => sum + week.publicToOtaku, 0);
    expect(attributed).toBe(resolved);
    expect(result.events.at(-1)?.liveId).toBe("tif-2014-08-02");
    expect(result.fanWeeklyResolutions.at(-1)?.weekEnd).toBe("2014-08-02:chapter-close");
  });

  it("has deterministic B 20-seed completion and no nine-member routine rotation", () => {
    const results = Array.from({ length: 20 }, (_, index) => runStaffAutoplayPrologue({ route: "B", seed: index + 1 }));
    expect(results.every((result) => result.stageStatus !== "BLOCKED_BUG")).toBe(true);
    for (const result of results) {
      expect(result.events.filter((event) => event.date < "2014-05-11").every((event) => event.participantIds.length > 0)).toBe(true);
      expect(result.events.filter((event) => event.date < "2014-05-11").every((event) => event.participantIds.length === 9)).toBe(true);
    }
  });

  it("runs the required B 100-seed robustness set without a Calendar softlock", () => {
    const results = Array.from({ length: 100 }, (_, index) => runStaffAutoplayPrologue({ route: "B", seed: index + 1 }));
    expect(results).toHaveLength(100);
    expect(results.every((result) => result.stageStatus !== "BLOCKED_BUG")).toBe(true);
    expect(results.every((result) => result.events.at(-1)?.liveId === "tif-2014-08-02")).toBe(true);
  });

  it("keeps A as a ten-person Staff rotation and makes C use a fresh October pool", () => {
    const a = runStaffAutoplayPrologue({ route: "A", seed: 1 });
    const b = runStaffAutoplayPrologue({ route: "B", seed: 1 });
    const c = runStaffAutoplayPrologue({ route: "C", seed: 1 });
    expect(a.events.filter((event) => event.date < "2014-05-11").every((event) => event.participantIds.length === 10)).toBe(true);
    expect(c.events.find((event) => event.date === "2013-10-05")?.participantIds).toHaveLength(9);
    expect(a.events[0].fanFlow.opening.otakuCount).toBe(b.events[0].fanFlow.opening.otakuCount);
    expect(c.events[0].fanFlow.opening.otakuCount).toBe(b.events[0].fanFlow.opening.otakuCount);
    expect(c.state.members.filter((member) => member.id.startsWith("C2-") && member.active)).toHaveLength(6);
    expect(c.state.members.filter((member) => member.id.startsWith("C2-")).every((member) => Object.values(member.developedPalette ?? {}).every((value) => value === 0))).toBe(true);
  });

  it("runs the A/B/C 20-seed counterfactual set under one scenario version", () => {
    const routes = (["A", "B", "C"] as const).flatMap((route) =>
      Array.from({ length: 20 }, (_, index) => runStaffAutoplayPrologue({ route, seed: index + 1 })),
    );
    expect(routes).toHaveLength(60);
    expect(routes.every((result) => result.scenarioVersion === "staff-autoplay-scenario-v7-fan-audit-contracts:S3-C")).toBe(true);
    expect(routes.every((result) => result.stageStatus !== "BLOCKED_BUG")).toBe(true);
  });

  it("keeps S3-A/B isolated and records the S3-C graduation re-arrangement with resolved duties", () => {
    const s3a = runStaffAutoplayPrologue({ route: "B", seed: 1, s3Variant: "S3-A" });
    const s3b = runStaffAutoplayPrologue({ route: "B", seed: 1, s3Variant: "S3-B" });
    const s3c = runStaffAutoplayPrologue({ route: "B", seed: 1, s3Variant: "S3-C" });
    const postGraduation = s3c.events.filter((event) => event.date > "2014-05-11");
    const postGraduationDuties = postGraduation.flatMap((event) => event.resolvedDuties ?? []);

    expect(s3a.familiaritySettlements).toEqual([]);
    expect(s3a.events.every((event) => event.resolvedDuties === undefined)).toBe(true);
    expect(s3b.familiaritySettlements.length).toBeGreaterThan(0);
    expect(s3b.events.every((event) => event.resolvedDuties === undefined)).toBe(true);
    expect(postGraduation.every((event) => event.arrangementVersion === "v2-after-rina-graduation")).toBe(true);
    expect(postGraduation.every((event) => (event.resolvedDuties?.length ?? 0) === 3)).toBe(true);
    expect(postGraduationDuties.every((duty) => duty.selectedMemberId !== "IPC1-001")).toBe(true);
    expect(s3c.state.performanceProgression.arrangements["prologue-staff-default-song:v1"]).toBeDefined();
    expect(s3c.state.performanceProgression.arrangements["prologue-staff-default-song:v2-after-rina-graduation"]).toBeDefined();
    expect(s3c.memberDevelopment["IPC1-001"]).toMatchObject({ active: false, trainingHours: 420 });
  });

  it("keeps contract attendance capacity-bounded and applies pending Fan momentum exactly once per week", () => {
    const result = runStaffAutoplayPrologue({ route: "B", seed: 1, s3Variant: "S3-C" });
    const eventFlow = result.events.reduce((total, event) => ({
      publicToOtaku: total.publicToOtaku + event.fanFlow.publicToOtaku,
      externalToOtaku: total.externalToOtaku + event.fanFlow.externalToOtaku,
      externalToPublic: total.externalToPublic + event.fanFlow.externalToPublic,
    }), { publicToOtaku: 0, externalToOtaku: 0, externalToPublic: 0 });
    const weeklyFlow = result.fanWeeklyResolutions.reduce((total, week) => ({
      publicToOtaku: total.publicToOtaku + week.publicToOtaku,
      externalToOtaku: total.externalToOtaku + week.externalToOtaku,
      externalToPublic: total.externalToPublic + week.externalToPublic,
    }), { publicToOtaku: 0, externalToOtaku: 0, externalToPublic: 0 });

    expect(result.events.every((event) => event.fanFlow.otakuAttendance + event.fanFlow.publicAttendance + event.fanFlow.externalAudience === event.actualAttendance)).toBe(true);
    expect(result.events.every((event) => event.fanFlow.publicToOtaku <= event.fanFlow.publicAttendance
      && event.fanFlow.externalToOtaku + event.fanFlow.externalToPublic <= event.fanFlow.externalAudience)).toBe(true);
    expect(result.events.every((event) => Object.values(event.fanFlow.initialAffinityByMember).reduce((sum, value) => sum + value, 0)
      === event.fanFlow.publicToOtaku + event.fanFlow.externalToOtaku)).toBe(true);
    expect(eventFlow).toEqual(weeklyFlow);
    expect(result.fanWeeklyResolutions.flatMap((week) => week.eventIds).sort()).toEqual(result.events.map((event) => event.liveId).sort());
  });

  it("keeps paid Cheki queue-backed, free events revenue-free, and Rina closed after graduation", () => {
    const result = runStaffAutoplayPrologue({ route: "B", seed: 1, s3Variant: "S3-C" });
    const mall = result.events.find((event) => event.kind === "free-mall")!;
    expect(mall.ticketRevenueJPY + mall.chekiGrossJPY + mall.chekiCommissionJPY).toBe(0);
    expect(result.events.every((event) => Object.values(event.cheki.queues).every((queue) => queue.completedUnits <= queue.requestedUnits
      && queue.completedUnitsByTier["1000"] + queue.completedUnitsByTier["2000"] === queue.completedUnits))).toBe(true);
    expect(result.events.filter((event) => event.date > "2014-05-11").every((event) => !event.participantIds.includes("IPC1-001")
      && !event.cheki.queues["IPC1-001"]
      && !event.fanFlow.initialAffinityByMember["IPC1-001"]
      && !event.fanFlow.existingOtakuAffinityByMember["IPC1-001"])).toBe(true);
    expect(result.fanWeeklyResolutions.filter((week) => week.weekEnd >= "2014-05-11")
      .every((week) => week.closing.members["IPC1-001"].affinityCount === 0)).toBe(true);
  });

  it("runs the explicit newcomer-voucher contract through the shared queue, fan momentum and cost ledger", () => {
    const input = {
      route: "B" as const,
      seed: 11,
      newcomerVoucher: { enabled: true, externalUptakeProbability: 1, conversionProbability: 1 },
    };
    const result = runStaffAutoplayPrologue(input);
    const trials = result.events.flatMap((event) => Object.values(event.cheki.queues));
    const requested = trials.reduce((sum, queue) => sum + queue.freeTrialRequested, 0);
    const served = trials.reduce((sum, queue) => sum + queue.freeTrialServed, 0);
    const variableCost = trials.reduce((sum, queue) => sum + queue.freeTrialVariableCostJPY, 0);
    const converted = result.events.reduce((sum, event) => sum + Object.values(event.fanFlow.freeTrialConversionsByMember).reduce((inner, value) => inner + value, 0), 0);
    expect(requested).toBeGreaterThan(0);
    expect(served).toBeGreaterThan(0);
    expect(converted).toBeGreaterThan(0);
    expect(converted).toBeLessThanOrEqual(served);
    expect(variableCost).toBe(served * 180);
    expect(result.state.finance.entries.filter((entry) => entry.category === "newcomer_voucher_cost").reduce((sum, entry) => sum + entry.amount, 0)).toBe(variableCost);
    const mall = result.events.find((event) => event.kind === "free-mall")!;
    expect(Object.values(mall.cheki.queues).every((queue) => queue.freeTrialRequested === 0 && queue.freeTrialServed === 0)).toBe(true);
    expect(runStaffAutoplayPrologue(input)).toEqual(result);
  });

  it("uses explicit C2/C3 demand without filling capacity and preserves the Scenario ticket ledger", () => {
    const withoutExternalDemand = runStaffAutoplayPrologue({
      route: "B",
      seed: 17,
      audienceDemand: { enabled: true, externalWatchingDemandByEventId: {} },
    });
    const withExternalDemand = runStaffAutoplayPrologue({
      route: "B",
      seed: 17,
      audienceDemand: {
        enabled: true,
        externalWatchingDemandByEventId: {
          "debut-2013-05-24": 140,
          "taiban-2013-05-29": 30,
          "festival-2014-08-02": 180,
        },
      },
    });

    const noDemandDebut = withoutExternalDemand.events.find((event) => event.liveId === "debut-2013-05-24")!;
    const demandedDebut = withExternalDemand.events.find((event) => event.liveId === "debut-2013-05-24")!;
    expect(noDemandDebut.audienceAttribution).toBeDefined();
    expect(noDemandDebut.fanFlow.externalAudience).toBe(noDemandDebut.audienceAttribution!.referredExternalWatching);
    expect(demandedDebut.fanFlow.externalAudience).toBeGreaterThanOrEqual(noDemandDebut.fanFlow.externalAudience);
    expect(withExternalDemand.events.every((event) => event.audienceAttribution
      && event.actualAttendance === event.audienceAttribution.actualUniqueAudience
      && event.actualAttendance <= 1_000)).toBe(true);
    expect(withExternalDemand.events.every((event) => event.fanFlow.otakuAttendance + event.fanFlow.publicAttendance + event.fanFlow.externalAudience === event.actualAttendance)).toBe(true);
    expect(withExternalDemand.events.every((event) => event.audienceAttribution!.publicToOtaku
      === event.audienceAttribution!.activePublicToOtaku + event.audienceAttribution!.referredPublicToOtaku)).toBe(true);
    expect(withExternalDemand.events.every((event) => event.ticketSettlementSource === "scenario-contract")).toBe(true);
    expect(runStaffAutoplayPrologue({
      route: "B",
      seed: 17,
      audienceDemand: {
        enabled: true,
        externalWatchingDemandByEventId: {
          "debut-2013-05-24": 140,
          "taiban-2013-05-29": 30,
          "festival-2014-08-02": 180,
        },
      },
    })).toEqual(withExternalDemand);
  });

  it("rolls C0 through C3 in isolated, deterministic v1.1 stages", () => {
    const c0 = runStaffAutoplayPrologue({ route: "B", seed: 23, fanAcquisitionStage: "C0" });
    const c1 = runStaffAutoplayPrologue({ route: "B", seed: 23, fanAcquisitionStage: "C1" });
    const c2 = runStaffAutoplayPrologue({ route: "B", seed: 23, fanAcquisitionStage: "C2" });
    const c3 = runStaffAutoplayPrologue({ route: "B", seed: 23, fanAcquisitionStage: "C3" });

    expect(c0.onlineWeeks).toEqual([]);
    expect(c1.onlineWeeks.length).toBeGreaterThan(0);
    expect(c1.onlineWeeks.reduce((sum, week) => sum + week.newPublic, 0)).toBeGreaterThan(0);
    expect(c1.events.every((event) => event.audienceAttribution === undefined)).toBe(true);
    expect(c2.events.every((event) => event.audienceAttribution !== undefined)).toBe(true);
    expect(c3.events.every((event) => event.audienceAttribution !== undefined)).toBe(true);
    expect(c2.events.every((event) => event.actualAttendance <= event.audienceCapacity
      && event.fanFlow.otakuAttendance + event.fanFlow.publicAttendance + event.fanFlow.externalAudience === event.actualAttendance)).toBe(true);
    expect(c3.events.every((event) => event.audienceAttribution!.publicToOtaku <= event.audienceAttribution!.ownedPublicWatching
      && event.audienceAttribution!.externalIdolWatching + event.audienceAttribution!.externalGeneralWatching === event.fanFlow.externalAudience)).toBe(true);
    expect(c2.events.some((event) => event.audienceAttribution!.configuredExternalDemand > 0)).toBe(true);
    expect(runStaffAutoplayPrologue({ route: "B", seed: 23, fanAcquisitionStage: "C3" })).toEqual(c3);
  });
});
