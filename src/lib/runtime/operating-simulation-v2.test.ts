import { describe, expect, it } from "vitest";
import { runOperatingSimulation, type OperatingSimulationOptions } from "./operating-simulation";

const sizes = [5, 9, 15] as const;
const seeds = Array.from({ length: 20 }, (_, index) => `operating-v2:${index + 1}`);
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const distribution = (values: number[]) => ({
  mean: mean(values),
  min: Math.min(...values),
  max: Math.max(...values),
});
const final = (result: ReturnType<typeof runOperatingSimulation>) => result.weeks.at(-1)!;

function matrix(rosterSize: 5 | 9 | 15, options?: OperatingSimulationOptions) {
  return seeds.map((seed) => runOperatingSimulation(rosterSize, seed, options));
}

function routeSummary(routes: ReturnType<typeof matrix>, options?: OperatingSimulationOptions) {
  const result = routes[0];
  const finalWeeks = routes.map(final);
  const initialAffinity = (options?.fanFixture?.affinityTotal ?? 24) / result.rosterSize;
  const members = Object.keys(finalWeeks[0].members).map((memberId) => ({
    memberId,
    finalAffinity: mean(finalWeeks.map((week) => week.members[memberId].affinityCount)),
    finalPurchaseWeightKJPY: mean(finalWeeks.map((week) => week.members[memberId].purchaseWeightKJPY)),
    impression: mean(routes.flatMap((route) => route.weeks.map((week) => week.members[memberId].impression))),
    expected: mean(routes.flatMap((route) => route.weeks.map((week) => week.members[memberId].expectedImpression))),
    affinityGain: mean(finalWeeks.map((week) => week.members[memberId].affinityCount - initialAffinity)),
    newAffinity: mean(routes.map((route) => route.weeks.reduce((sum, week) => sum + week.members[memberId].newAffinity, 0))),
    chekiRequested: mean(routes.map((route) => route.weeks.reduce((sum, week) => sum + week.members[memberId].chekiRequestedJPY, 0))),
    chekiGross: mean(routes.map((route) => route.weeks.reduce((sum, week) => sum + week.members[memberId].chekiGrossJPY, 0))),
    chekiLost: mean(routes.map((route) => route.weeks.reduce((sum, week) => sum + week.members[memberId].chekiQueueLostJPY, 0))),
  }));
  return {
    finalP: distribution(finalWeeks.map((week) => week.publicCount)),
    finalO: distribution(finalWeeks.map((week) => week.otakuCount)),
    finalAffinity: distribution(finalWeeks.map((week) => week.affinityTotal)),
    totalCheki: distribution(routes.map((route) => route.weeks.reduce((sum, week) => sum + week.chekiGrossJPY, 0))),
    finalCash: distribution(routes.map((route) => route.finance.cash)),
    weeks: result.weeks.map((_, index) => ({
      week: index + 1,
      attendance: mean(routes.map((route) => route.weeks[index].attendance)),
      publicCount: mean(routes.map((route) => route.weeks[index].publicCount)),
      otakuCount: mean(routes.map((route) => route.weeks[index].otakuCount)),
      affinityTotal: mean(routes.map((route) => route.weeks[index].affinityTotal)),
      operatingRevenue: mean(routes.map((route) => route.weeks[index].operatingRevenueJPY)),
      operatingCost: mean(routes.map((route) => route.weeks[index].operatingCostJPY)),
      cash: mean(routes.map((route) => route.weeks[index].cash)),
    })),
    members,
  };
}

describe("Operating Simulation v2 — Roster & Performance Calibration", () => {
  it("A: isolates roster size from a fixed neutral fan market", () => {
    const summary = Object.fromEntries(sizes.map((size) => [size, routeSummary(matrix(size))]));
    expect(matrix(9)).toEqual(matrix(9));
    for (const size of sizes) {
      expect(summary[size].finalO.mean).toBeGreaterThan(0);
      expect(summary[size].members.every((member) => Number.isFinite(member.affinityGain))).toBe(true);
      expect(summary[size].weeks).toHaveLength(12);
    }
    console.info(`OPERATING_V2_A ${JSON.stringify(summary)}`);
  });

  it("B: gives larger rosters independent, but overlapping, starting support", () => {
    const fixtures = {
      5: { publicCount: 300, otakuCount: 40, affinityTotal: 24, purchaseWeightKJPY: 2 },
      9: { publicCount: 400, otakuCount: 60, affinityTotal: 43, purchaseWeightKJPY: 2 },
      15: { publicCount: 550, otakuCount: 85, affinityTotal: 72, purchaseWeightKJPY: 2 },
    } as const;
    const summary = Object.fromEntries(sizes.map((size) => [size, routeSummary(matrix(size, { fanFixture: fixtures[size] }), { fanFixture: fixtures[size] })]));
    expect(summary[15].totalCheki.mean).toBeGreaterThan(summary[5].totalCheki.mean);
    expect(summary[15].finalO.mean).toBeGreaterThan(summary[5].finalO.mean);
    console.info(`OPERATING_V2_B ${JSON.stringify(summary)}`);
  });

  it("C: routes a member's stronger actual Impression primarily to that member's affinity", () => {
    const neutral = routeSummary(matrix(9));
    const allHigher = routeSummary(matrix(9, { performanceMultiplierByMember: Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`IPC1-${String(index + 1).padStart(3, "0")}`, 1.2])) }));
    const star = routeSummary(matrix(9, { performanceMultiplierByMember: { "IPC1-001": 1.8 } }));
    const vocal = routeSummary(matrix(9, { performanceMultiplierByMember: { "IPC1-002": 1.7 } }));
    const lower = routeSummary(matrix(9, { performanceMultiplierByMember: { "IPC1-001": 0.65, "IPC1-002": 0.65, "IPC1-003": 0.65 } }));
    const member = (summary: typeof neutral, id: string) => summary.members.find((item) => item.memberId === id)!;
    expect(allHigher.finalO.mean).toBeGreaterThan(neutral.finalO.mean);
    expect(star.finalO.mean).toBeGreaterThanOrEqual(neutral.finalO.mean);
    expect(member(star, "IPC1-001").affinityGain).toBeGreaterThan(member(neutral, "IPC1-001").affinityGain);
    expect(member(star, "IPC1-001").affinityGain - member(neutral, "IPC1-001").affinityGain).toBeGreaterThan(member(star, "IPC1-003").affinityGain - member(neutral, "IPC1-003").affinityGain);
    expect(member(vocal, "IPC1-002").affinityGain).toBeGreaterThan(member(neutral, "IPC1-002").affinityGain);
    expect(lower.finalO.mean).toBeLessThan(neutral.finalO.mean);
    console.info(`OPERATING_V2_C ${JSON.stringify({ neutral, allHigher, star, vocal, lower })}`);
  });

  it("never converts to a member with zero actual Impression/contact", () => {
    const route = runOperatingSimulation(9, "operating-v2:no-contact", { performanceMultiplierByMember: { "IPC1-001": 0 } });
    expect(route.weeks.every((week) => week.members["IPC1-001"].eligibleExposedOtaku === 0)).toBe(true);
    expect(route.weeks.every((week) => week.members["IPC1-001"].newAffinity === 0)).toBe(true);
  });
});
