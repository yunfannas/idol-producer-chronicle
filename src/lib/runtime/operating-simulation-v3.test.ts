import { describe, expect, it } from "vitest";
import { createOperatingSimulationV3Session, runOperatingSimulationV3, type StaffWeekDecision } from "./operating-simulation";

const seeds = Array.from({ length: 20 }, (_, index) => `operating-v3:${index + 1}`);
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const plans = {
  performance: { lineupStrategy: "performance-first", trainingIntensity: "normal", liveCadence: "scheduled-only" },
  affinity: { lineupStrategy: "affinity-first", trainingIntensity: "normal", liveCadence: "scheduled-only" },
  development: { lineupStrategy: "development-first", trainingIntensity: "normal", liveCadence: "scheduled-only" },
  adaptive: { lineupStrategy: "condition-song-fit", trainingIntensity: "conservative", liveCadence: "scheduled-only" },
  highFrequency: { lineupStrategy: "performance-first", trainingIntensity: "normal", liveCadence: "extra-taiban" },
  aggressive: { lineupStrategy: "condition-song-fit", trainingIntensity: "aggressive", liveCadence: "scheduled-only" },
} satisfies Record<string, StaffWeekDecision>;

function routes(decision: StaffWeekDecision) {
  return seeds.map((seed) => runOperatingSimulationV3({ rosterSize: 15, seed, decide: () => decision }));
}

function summary(results: ReturnType<typeof routes>) {
  const finalWeeks = results.map((result) => result.weeks.at(-1)!);
  const trainingTotals = results.map((result) => result.members.map((member) => member.trainingExp));
  return {
    finalO: mean(finalWeeks.map((week) => week.otakuCount)),
    finalAffinity: mean(finalWeeks.map((week) => week.affinityTotal)),
    finalCash: mean(finalWeeks.map((week) => week.cash)),
    totalRevenue: mean(results.map((result) => result.weeks.reduce((sum, week) => sum + week.operatingRevenueJPY, 0))),
    totalCheki: mean(results.map((result) => result.weeks.reduce((sum, week) => sum + Object.values(week.members).reduce((memberSum, member) => memberSum + member.chekiGrossJPY, 0), 0))),
    attendance: mean(results.map((result) => result.weeks.reduce((sum, week) => sum + week.attendance, 0))),
    lowestMeanCondition: mean(results.map((result) => Math.min(...result.weeks.map((week) => week.meanCondition)))),
    meanTraining: mean(trainingTotals.map((training) => mean(training))),
    trainingSpread: mean(trainingTotals.map((training) => Math.max(...training) - Math.min(...training))),
    distinctPerformers: mean(results.map((result) => new Set(result.weeks.flatMap((week) => week.participantIds)).size)),
  };
}

describe("Operating Simulation v3 — Staff Decisions & Weekly Gameplay", () => {
  it("offers a deterministic weekly proposal, then settles only after confirmation", () => {
    const session = createOperatingSimulationV3Session(15, "operating-v3:weekly");
    const proposal = session.proposeWeek()!;
    expect(proposal.decisionRequired).toBe(false);
    expect(proposal.suggestedLineupIds).toHaveLength(10);
    expect(proposal.managerApAvailable).toBe(20);
    const report = session.confirmWeek({ lineupStrategy: "development-first", trainingIntensity: "normal" });
    expect(report.trainingTargetIds).toHaveLength(10);
    expect(report.participantIds).toHaveLength(10);
    expect(report.managerApUsed).toBeLessThanOrEqual(report.managerApAvailable);
    expect(session.proposeWeek()?.week).toBe(2);
  });

  it("rejects an overcommitted staff plan rather than inventing manager capacity", () => {
    const session = createOperatingSimulationV3Session(15, "operating-v3:ap-conflict");
    expect(() => session.confirmWeek({ trainingIntensity: "aggressive", liveCadence: "extra-taiban" })).toThrow("Staff AP conflict");
  });

  it("makes staff strategies produce explainable, non-dominant 12-week outcomes", () => {
    const summaries = Object.fromEntries(Object.entries(plans).map(([name, decision]) => [name, summary(routes(decision))]));
    expect(routes(plans.performance)).toEqual(routes(plans.performance));
    console.info(`OPERATING_V3 ${JSON.stringify(summaries)}`);
    // Development distributes scarce focus to the least-trained members; it
    // gives up short-term specialist continuity rather than a free bonus.
    expect(summaries.development.trainingSpread).toBeLessThan(summaries.performance.trainingSpread);
    expect(summaries.development.distinctPerformers).toBeGreaterThanOrEqual(summaries.performance.distinctPerformers);
    // Extra Live has only its explicit contract income, while adding exposure
    // and workload. It must not be a free, costless audience multiplier.
    expect(summaries.highFrequency.attendance).toBeGreaterThan(summaries.performance.attendance);
    expect(summaries.highFrequency.totalRevenue).toBeGreaterThan(summaries.performance.totalRevenue);
    expect(summaries.highFrequency.lowestMeanCondition).toBeLessThan(summaries.performance.lowestMeanCondition);
    // More training buys member development at a cash cost. The low-Condition
    // guard can stop an unsafe aggressive session, so it must not be treated
    // as a license to force a worse health outcome.
    expect(summaries.aggressive.meanTraining).toBeGreaterThan(summaries.adaptive.meanTraining);
    expect(summaries.aggressive.finalCash).toBeLessThan(summaries.adaptive.finalCash);
    for (const route of routes(plans.highFrequency)) {
      for (let week = 1; week < route.weeks.length; week += 1) {
        const previouslyLow = new Set(Object.entries(route.weeks[week - 1].members)
          .filter(([, member]) => member.condition < 55)
          .map(([memberId]) => memberId));
        expect(route.weeks[week].trainingTargetIds.every((memberId) => !previouslyLow.has(memberId))).toBe(true);
      }
    }
  });
});
