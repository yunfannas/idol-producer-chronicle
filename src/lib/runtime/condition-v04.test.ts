import { describe, expect, it } from "vitest";
import {
  morningAbnormalityProbabilityV04,
  resolveMorningAbnormalitiesV04,
  resolveSongConditionV04,
  resolveTrainingConditionV04,
  settleMorningRecoveryV04,
  staminaMultiplierV04,
  thresholdFractionBelow70V04,
} from "./condition-v04";

const rested = {
  condition: 100,
  physicalFatigue: 0,
  vocalFatigue: 0,
  physicalAbnormality: "none" as const,
  vocalAbnormality: "none" as const,
};

describe("Condition / PF / VF v0.4", () => {
  it("uses one song-start Condition cost and does not double-charge PF/VF", () => {
    const result = resolveSongConditionV04({ state: rested, stamina: 14, vocalDifficulty: 12, danceDifficulty: 12, fullDanceSeconds: 200, vocalSeconds: 120 });
    expect(staminaMultiplierV04(14)).toBe(1);
    expect(result.danceLoad).toBeCloseTo(2, 10);
    expect(result.vocalLoad).toBeCloseTo(1.9, 10);
    expect(result.conditionCost).toBeCloseTo((0.5 + 2 + 1.9) * 0.67, 10);
    expect(result.state.condition).toBeCloseTo(100 - result.conditionCost, 10);
    expect(result.physicalFatigueGain).toBe(0);
    expect(result.vocalFatigueGain).toBe(0);
  });

  it("accumulates only matching low-Condition fatigue and honors abnormality feedback", () => {
    const low = { ...rested, condition: 60, physicalAbnormality: "mild" as const, vocalAbnormality: "moderate" as const };
    const result = resolveSongConditionV04({ state: low, stamina: 14, vocalDifficulty: 12, danceDifficulty: 12, fullDanceSeconds: 200, vocalSeconds: 120 });
    expect(result.lowConditionFraction).toBe(1);
    expect(result.physicalFatigueGain).toBeCloseTo(2 * 1.25, 10);
    expect(result.vocalFatigueGain).toBeCloseTo(1.9 * 1.5, 10);
    expect(thresholdFractionBelow70V04(72, 66)).toBeCloseTo(4 / 6, 10);
  });

  it("uses 0.5h training slots with the locked 1.25 cost and .65 fatigue coefficients", () => {
    const result = resolveTrainingConditionV04({
      state: { ...rested, condition: 60 }, stamina: 14, rawLoadPerHour: 3, hours: 0.5, physicalShare: 0.5, vocalShare: 0.5,
    });
    expect(result.conditionCost).toBeCloseTo(1.5 * 1.25 * (0.67 + 0.10 / 3), 10);
    expect(result.physicalFatigueGain).toBeCloseTo(0.65 * 0.75, 10);
    expect(result.vocalFatigueGain).toBeCloseTo(0.65 * 0.75, 10);
  });

  it("settles recovery and one reproducible morning incident check separately", () => {
    const exhausted = { ...rested, condition: 50, physicalFatigue: 40, vocalFatigue: 40 };
    const recovered = settleMorningRecoveryV04({ state: exhausted, sleepHours: 8, sleepQualityMultiplier: 1, naturalFitness: 14, morale: 50 });
    expect(recovered.condition).toBeGreaterThan(exhausted.condition);
    expect(recovered.physicalFatigue).toBeCloseTo(38, 10);
    expect(recovered.vocalFatigue).toBeCloseTo(37.5, 10);
    expect(morningAbnormalityProbabilityV04(25)).toBe(0);
    expect(morningAbnormalityProbabilityV04(79)).toBe(0.08);
    const input = { saveId: "save", localDate: "2013-05-24", memberId: "member", state: recovered };
    expect(resolveMorningAbnormalitiesV04(input)).toEqual(resolveMorningAbnormalitiesV04(input));
  });
});
