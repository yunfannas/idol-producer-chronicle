import { describe, expect, it } from "vitest";
import { runStaffAutoplayPrologue } from "./staff-autoplay";

describe("Staff autoplay prologue E2E", () => {
  it("runs B seed 1 through the immutable TIF event with real kernels and a reconcilable ledger", () => {
    const result = runStaffAutoplayPrologue({ route: "B", seed: 1 });
    expect(result.stageStatus).not.toBe("BLOCKED_BUG");
    expect(result.events.at(-1)?.liveId).toBe("tif-2014-08-02");
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
    expect(routes.every((result) => result.scenarioVersion === "staff-autoplay-scenario-v5-s3c-familiarity-key-duty:S3-C")).toBe(true);
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
});
