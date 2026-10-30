import { createSeededRandom } from "./random";

export type AbnormalitySeverityV04 = "none" | "mild" | "moderate" | "severe";

export type ConditionStateV04 = {
  condition: number;
  physicalFatigue: number;
  vocalFatigue: number;
  physicalAbnormality: AbnormalitySeverityV04;
  vocalAbnormality: AbnormalitySeverityV04;
};

export const conditionV04Tunable = {
  version: "condition-pf-vf-v0.4c",
  lowConditionBase: 0.67,
  lowConditionRange: 0.10,
  live: { danceBase: 2.0, vocalBase: 1.9, fatigueMultiplier: 1.0 },
  training: { conditionMultiplier: 1.25, fatigueMultiplier: 0.65 },
  fatigueRecovery: { physical: 2.0, vocal: 2.5 },
  abnormality: { baseAtFatigue25: 0.0015, maxDailyProbability: 0.08 },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function staminaMultiplierV04(stamina: number) {
  if (!Number.isFinite(stamina)) throw new Error("Stamina must be finite");
  // v0.4 defines 12/14/16 anchors, not an unbounded 0–20 formula. Keep the
  // candidate linear interpolation explicitly bounded until calibration.
  return clamp(1 - 0.06 * (stamina - 14), 0.64, 1.24);
}

export function naturalFitnessMultiplierV04(naturalFitness: number) {
  if (!Number.isFinite(naturalFitness)) throw new Error("Natural Fitness must be finite");
  // Anchors NF10≈.75 / 14=1 / 16≈1.17 / 20≈1.50; bounded interpolation.
  return clamp(0.75 + (naturalFitness - 10) * 0.0625, 0.75, 1.5);
}

export function lowConditionAmplifierV04(condition: number) {
  if (!Number.isFinite(condition)) throw new Error("Condition must be finite");
  return conditionV04Tunable.lowConditionBase + conditionV04Tunable.lowConditionRange * clamp((70 - condition) / 30, 0, 1);
}

export function abnormalityAccumulationMultiplierV04(severity: AbnormalitySeverityV04) {
  return severity === "mild" ? 1.25 : severity === "moderate" ? 1.5 : severity === "severe" ? 2 : 1;
}

export function thresholdFractionBelow70V04(conditionBefore: number, conditionAfterWithoutRecovery: number) {
  if (conditionBefore >= 70 && conditionAfterWithoutRecovery >= 70) return 0;
  if (conditionBefore <= 70 && conditionAfterWithoutRecovery <= 70) return 1;
  if (conditionBefore > 70 && conditionAfterWithoutRecovery < 70) return clamp((70 - conditionAfterWithoutRecovery) / (conditionBefore - conditionAfterWithoutRecovery), 0, 1);
  // The v0.4 contract does not let an upward recovery crossing infer load
  // exposure from the net endpoints. Callers must pass the real trajectory.
  return 0;
}

export type SongConditionInputV04 = {
  state: ConditionStateV04;
  stamina: number;
  vocalDifficulty: number;
  danceDifficulty: number;
  fullDanceSeconds: 200 | 220;
  vocalSeconds: number;
  boundaryRecovery?: number;
};

export type ConditionSlotResultV04 = {
  state: ConditionStateV04;
  conditionCost: number;
  danceLoad: number;
  vocalLoad: number;
  lowConditionFraction: number;
  physicalFatigueGain: number;
  vocalFatigueGain: number;
};

function resolveSlot(input: {
  state: ConditionStateV04;
  stamina: number;
  generalLoad: number;
  physicalLoad: number;
  vocalLoad: number;
  conditionMultiplier: number;
  fatigueMultiplier: number;
  boundaryRecovery: number;
}): ConditionSlotResultV04 {
  const conditionBefore = input.state.condition;
  const conditionCost = (input.generalLoad + input.physicalLoad + input.vocalLoad) * input.conditionMultiplier * staminaMultiplierV04(input.stamina) * lowConditionAmplifierV04(conditionBefore);
  const afterWithoutRecovery = clamp(conditionBefore - conditionCost, 0, 100);
  const lowConditionFraction = thresholdFractionBelow70V04(conditionBefore, afterWithoutRecovery);
  const physicalFatigueGain = input.fatigueMultiplier * input.physicalLoad * lowConditionFraction * abnormalityAccumulationMultiplierV04(input.state.physicalAbnormality);
  const vocalFatigueGain = input.fatigueMultiplier * input.vocalLoad * lowConditionFraction * abnormalityAccumulationMultiplierV04(input.state.vocalAbnormality);
  return {
    conditionCost,
    danceLoad: input.physicalLoad,
    vocalLoad: input.vocalLoad,
    lowConditionFraction,
    physicalFatigueGain,
    vocalFatigueGain,
    state: {
      ...input.state,
      condition: clamp(afterWithoutRecovery + input.boundaryRecovery, 0, 100),
      physicalFatigue: clamp(input.state.physicalFatigue + physicalFatigueGain, 0, 100),
      vocalFatigue: clamp(input.state.vocalFatigue + vocalFatigueGain, 0, 100),
    },
  };
}

/** Resolves exactly one song from its start-of-song state. */
export function resolveSongConditionV04(input: SongConditionInputV04): ConditionSlotResultV04 {
  if (!Number.isFinite(input.vocalSeconds) || input.vocalSeconds < 0) throw new Error("Vocal seconds must be non-negative");
  if (input.vocalDifficulty < 0 || input.danceDifficulty < 0) throw new Error("Song difficulties must be non-negative");
  const danceLoad = conditionV04Tunable.live.danceBase * (input.fullDanceSeconds / 200) * (input.danceDifficulty / 12);
  const vocalLoad = conditionV04Tunable.live.vocalBase * (input.vocalSeconds / 120) * (input.vocalDifficulty / 12);
  return resolveSlot({ state: input.state, stamina: input.stamina, generalLoad: 0.5, physicalLoad: danceLoad, vocalLoad, conditionMultiplier: 1, fatigueMultiplier: conditionV04Tunable.live.fatigueMultiplier, boundaryRecovery: input.boundaryRecovery ?? 0 });
}

export type TrainingConditionInputV04 = {
  state: ConditionStateV04;
  stamina: number;
  rawLoadPerHour: number;
  hours: 0.5;
  physicalShare: number;
  vocalShare: number;
};

/** Resolves a v0.4 0.5h training slot; shares must exhaust its RawLoad. */
export function resolveTrainingConditionV04(input: TrainingConditionInputV04): ConditionSlotResultV04 {
  if (input.physicalShare < 0 || input.vocalShare < 0 || Math.abs(input.physicalShare + input.vocalShare - 1) > 1e-9) throw new Error("Training load shares must sum to one");
  const rawLoad = input.rawLoadPerHour * input.hours;
  return resolveSlot({
    state: input.state,
    stamina: input.stamina,
    generalLoad: 0,
    physicalLoad: rawLoad * input.physicalShare,
    vocalLoad: rawLoad * input.vocalShare,
    conditionMultiplier: conditionV04Tunable.training.conditionMultiplier,
    fatigueMultiplier: conditionV04Tunable.training.fatigueMultiplier,
    boundaryRecovery: 0,
  });
}

export function sleepConditionRecoveryV04(input: { conditionAtBed: number; sleepHours: number; sleepQualityMultiplier: number; naturalFitness: number; morale: number; eligibleRestCredit?: number }) {
  const sleep = 22 * (Math.max(0, input.sleepHours) / 8) ** 0.8 * naturalFitnessMultiplierV04(input.naturalFitness)
    * (0.9 + 0.002 * input.morale) * (0.90 + 0.40 * ((100 - input.conditionAtBed) / 100) ** 2) * input.sleepQualityMultiplier;
  return Math.max(0, sleep + (input.eligibleRestCredit ?? 0));
}

export function settleMorningRecoveryV04(input: { state: ConditionStateV04; sleepHours: number; sleepQualityMultiplier: number; naturalFitness: number; morale: number; eligibleRestCredit?: number }): ConditionStateV04 {
  const restEffectiveness = clamp((Math.max(0, input.sleepHours) / 8) ** 0.8 * input.sleepQualityMultiplier, 0, 1);
  return {
    ...input.state,
    condition: clamp(input.state.condition + sleepConditionRecoveryV04({ conditionAtBed: input.state.condition, sleepHours: input.sleepHours, sleepQualityMultiplier: input.sleepQualityMultiplier, naturalFitness: input.naturalFitness, morale: input.morale, eligibleRestCredit: input.eligibleRestCredit }), 0, 100),
    physicalFatigue: Math.max(0, input.state.physicalFatigue - conditionV04Tunable.fatigueRecovery.physical * naturalFitnessMultiplierV04(input.naturalFitness) * restEffectiveness),
    vocalFatigue: Math.max(0, input.state.vocalFatigue - conditionV04Tunable.fatigueRecovery.vocal * naturalFitnessMultiplierV04(input.naturalFitness) * restEffectiveness),
  };
}

function nextSeverity(severity: AbnormalitySeverityV04): AbnormalitySeverityV04 {
  return severity === "none" ? "mild" : severity === "mild" ? "moderate" : severity === "moderate" ? "severe" : "severe";
}

export function morningAbnormalityProbabilityV04(fatigue: number) {
  return Math.min(conditionV04Tunable.abnormality.maxDailyProbability, conditionV04Tunable.abnormality.baseAtFatigue25 * Math.max(0, fatigue - 25));
}

/** One deterministic check per day/member/type; callers persist its day key. */
export function resolveMorningAbnormalitiesV04(input: { saveId: string; localDate: string; memberId: string; state: ConditionStateV04 }): ConditionStateV04 {
  const check = (type: "physical" | "vocal", fatigue: number) => createSeededRandom(`${input.saveId}:${input.localDate}:${input.memberId}:${type}`)() < morningAbnormalityProbabilityV04(fatigue);
  const physical = check("physical", input.state.physicalFatigue);
  const vocal = check("vocal", input.state.vocalFatigue);
  return {
    ...input.state,
    physicalAbnormality: physical ? nextSeverity(input.state.physicalAbnormality) : input.state.physicalAbnormality,
    vocalAbnormality: vocal ? nextSeverity(input.state.vocalAbnormality) : input.state.vocalAbnormality,
  };
}
