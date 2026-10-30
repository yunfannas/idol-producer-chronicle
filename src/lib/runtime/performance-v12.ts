import type { Color8, SongPalette } from "./types";
import { createSeededRandom } from "./random";

/**
 * Technical Performance v1.2 / Impression v1.0 implementation kernel.
 *
 * All values in `performanceV12Tunable` are versioned starting anchors from
 * the specification, not calibrated scenario truth. This module has no fan,
 * Cheki, Finance, or persisted-save side effects.
 */

export const PALETTE_V21_ORDER: readonly Color8[] = [
  "red", "orange", "yellow", "green", "aqua", "blue", "purple", "pink",
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const performanceV12Tunable = {
  version: "technical-performance-v1.2/impression-v1.0",
  songAppeal: { intercept: 35, scale: 65, exponent: 1.4 },
  condition: { lowThreshold: 70, penaltyPerPoint: 0.06, maxPenalty: 3 },
  failure: { logisticIntercept: 3, logisticSlope: 0.75, firstPenalty: 0.30, decay: 0.8, floor: 0.20, unisonPitchMultiplier: 0.25 },
  expression: { maxToneBonus: 0.12, maxPowerBonus: 0.12, bonusPerPoint: 0.012, stagePresenceBase: 0.85, stagePresencePerPoint: 0.015, stagePresenceMin: 0.85, stagePresenceMax: 1.15 },
  aggregation: { vocalWeight: 0.5, danceWeight: 0.5 },
  environment: {
    public: { worldSlope: 0.005, minWorld: 0.8, maxWorld: 1.3, penaltyAt25: 0.12, penaltyCap: 0.60 },
    otaku: { worldSlope: 0.0025, minWorld: 0.9, maxWorld: 1.15, penaltyAt25: 0.20, penaltyCap: 0.70 },
    penaltyExponent: 1.15,
    liveSaturationDecay: 0.70,
    liveSaturationInput: 0.50,
    teamSaturationBase: 50,
  },
} as const;

export type TechnicalAttributesV12 = {
  breath: number;
  rhythm: number;
  power: number;
  pitch: number;
  tone: number;
  agility: number;
  stagePresence: number;
};

export type TechnicalPerformerV12 = {
  id: string;
  condition: number;
  attributes: TechnicalAttributesV12;
  /** Optional scenario/test hook; applied once to this member's own result. */
  expressionMultiplier?: number;
};

export type VocalSliceV12 = {
  singerMemberId: string;
  startSec: number;
  endSec: number;
};

export type PerformancePartV12 = {
  id: string;
  order: number;
  durationSec: number;
  /** A pre-authored intrinsic Part exposure; no standing-position bonus. */
  exposure: number;
  mode: "none" | "relay" | "unison";
  relaySlices?: VocalSliceV12[];
  unisonSingerIds?: string[];
  dancerIds: string[];
};

export type SongPerformanceInputV12 = {
  seed: string;
  liveId: string;
  songId: string;
  arrangementVersion: string;
  vocalDifficulty: number;
  danceDifficulty: number;
  pitchRequirement?: number;
  agilityRequirement?: number;
  /** Intrinsic M(FinalPE), supplied by Palette kernel and applied once. */
  paletteExpressionMultiplier: number;
  /** Arrangement familiarity execution factor, supplied once by caller. */
  familiarityFactor?: number;
  performers: TechnicalPerformerV12[];
  parts: PerformancePartV12[];
  /** Tests may force only the pass/fail outcome, never a synthetic target. */
  forcedFailures?: Record<string, boolean>;
};

export type LocalFailureEventV12 = {
  memberId: string;
  path: "vocal" | "dance";
  checkId: string;
  checkScope: "primary" | "ochi_extra";
  partId: string;
  ordinalInSongPath: number;
  incrementalPenalty: number;
};

export type MemberPartExecutionV12 = {
  memberId: string;
  partId: string;
  vocalSeconds: number;
  danceSeconds: number;
  vocalExecution: number;
  danceExecution: number;
  vocalCredit: number;
  danceCredit: number;
};

export type PartPerformanceV12 = {
  partId: string;
  teamPerf: number;
  vocalTeamPerf: number;
  danceTeamPerf: number;
  memberPerfById: Record<string, number>;
  coverage: { vocalComplete: boolean; danceComplete: boolean };
};

export type SongPerformanceResultV12 = {
  resultVersion: typeof performanceV12Tunable.version;
  songAppeal: number;
  failures: LocalFailureEventV12[];
  memberPartExecutions: MemberPartExecutionV12[];
  parts: PartPerformanceV12[];
  memberPerfById: Record<string, number>;
  teamPerf: number;
};

function assertFinite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}

function assertSongDifficulty(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 20) throw new Error(`${label} must be in [0, 20]`);
}

export function songAppealV12(vocalDifficulty: number, danceDifficulty: number) {
  assertSongDifficulty(vocalDifficulty, "Vocal difficulty");
  assertSongDifficulty(danceDifficulty, "Dance difficulty");
  const difficulty = (vocalDifficulty + danceDifficulty) / 2;
  const { intercept, scale, exponent } = performanceV12Tunable.songAppeal;
  return Math.round(clamp(intercept + scale * (difficulty / 20) ** exponent, 0, 100));
}

export function abilityBaseV12(attribute: number) {
  assertFinite(attribute, "Ability");
  return 2 ** ((attribute - 12) / 12);
}

export function difficultyPenaltyV12(attribute: number, difficulty: number) {
  assertFinite(attribute, "Ability");
  assertSongDifficulty(difficulty, "Difficulty");
  return Math.exp(-0.075 * Math.max(0, difficulty - attribute) ** 1.15);
}

export function technicalExecutionV12(attribute: number, difficulty: number) {
  return abilityBaseV12(attribute) * difficultyPenaltyV12(attribute, difficulty);
}

export function conditionAttributePenaltyV12(condition: number) {
  assertFinite(condition, "Condition");
  const tuning = performanceV12Tunable.condition;
  return tuning.penaltyPerPoint * clamp(tuning.lowThreshold - condition, 0, 50);
}

export function failureProbabilityV12(margin: number) {
  assertFinite(margin, "Failure margin");
  const { logisticIntercept, logisticSlope } = performanceV12Tunable.failure;
  return 1 / (1 + Math.exp(logisticIntercept + logisticSlope * margin));
}

function technicalBases(member: TechnicalPerformerV12, input: SongPerformanceInputV12) {
  const penalty = conditionAttributePenaltyV12(member.condition);
  const breath = clamp(member.attributes.breath - penalty, 0, 20);
  const vocalRhythm = clamp(member.attributes.rhythm - penalty, 0, 20);
  const danceRhythm = clamp(member.attributes.rhythm - penalty, 0, 20);
  const power = clamp(member.attributes.power - penalty, 0, 20);
  const toneBonus = Math.min(performanceV12Tunable.expression.maxToneBonus, performanceV12Tunable.expression.bonusPerPoint * Math.max(0, member.attributes.tone - 10));
  const powerBonus = Math.min(performanceV12Tunable.expression.maxPowerBonus, performanceV12Tunable.expression.bonusPerPoint * Math.max(0, power - 10));
  const stage = clamp(
    performanceV12Tunable.expression.stagePresenceBase + performanceV12Tunable.expression.stagePresencePerPoint * member.attributes.stagePresence,
    performanceV12Tunable.expression.stagePresenceMin,
    performanceV12Tunable.expression.stagePresenceMax,
  );
  const common = stage * input.paletteExpressionMultiplier * (input.familiarityFactor ?? 1) * (member.expressionMultiplier ?? 1);
  return {
    vocal: ((technicalExecutionV12(breath, input.vocalDifficulty) + technicalExecutionV12(vocalRhythm, input.vocalDifficulty)) / 2 + toneBonus) * common,
    dance: (technicalExecutionV12(danceRhythm, input.danceDifficulty) + powerBonus) * common,
  };
}

function isContiguousRelay(part: PerformancePartV12, performers: Set<string>) {
  const slices = part.relaySlices ?? [];
  if (part.mode !== "relay") return;
  let cursor = 0;
  for (const slice of slices) {
    if (!performers.has(slice.singerMemberId)) throw new Error(`Unknown relay singer ${slice.singerMemberId}`);
    if (slice.startSec !== cursor || slice.endSec <= slice.startSec || slice.endSec > part.durationSec) {
      throw new Error(`Relay slices for ${part.id} must be contiguous, ordered, and within the Part`);
    }
    cursor = slice.endSec;
  }
  if (slices.length > 0 && cursor !== part.durationSec) throw new Error(`Relay slices for ${part.id} must cover the authored duration or be explicitly unfilled`);
}

function validatePart(part: PerformancePartV12, performers: Set<string>) {
  if (!Number.isFinite(part.durationSec) || part.durationSec <= 0) throw new Error(`Part ${part.id} needs positive duration`);
  if (!Number.isFinite(part.exposure) || part.exposure < 0) throw new Error(`Part ${part.id} needs non-negative exposure`);
  if (new Set(part.dancerIds).size !== part.dancerIds.length || part.dancerIds.some((id) => !performers.has(id))) throw new Error(`Part ${part.id} has an invalid dancer`);
  if (part.mode === "relay") isContiguousRelay(part, performers);
  if (part.mode === "unison") {
    const singers = part.unisonSingerIds ?? [];
    if (new Set(singers).size !== singers.length || singers.some((id) => !performers.has(id))) throw new Error(`Part ${part.id} has an invalid unison singer`);
  }
  if (part.mode === "none" && ((part.relaySlices?.length ?? 0) > 0 || (part.unisonSingerIds?.length ?? 0) > 0)) throw new Error(`Non-vocal Part ${part.id} cannot have singers`);
}

function weightedPartPick(seed: string, parts: Array<{ id: string; seconds: number }>) {
  const total = parts.reduce((sum, part) => sum + part.seconds, 0);
  if (total <= 0) throw new Error("No eligible Part for failure placement");
  let cursor = createSeededRandom(seed)() * total;
  for (const part of parts) {
    cursor -= part.seconds;
    if (cursor <= 0) return part.id;
  }
  return parts.at(-1)!.id;
}

function localFailureKey(memberId: string, path: "vocal" | "dance", scope: "primary" | "ochi_extra") {
  return `${memberId}:${path}:${scope}`;
}

export function resolveSongPerformanceV12(input: SongPerformanceInputV12): SongPerformanceResultV12 {
  assertSongDifficulty(input.vocalDifficulty, "Vocal difficulty");
  assertSongDifficulty(input.danceDifficulty, "Dance difficulty");
  assertFinite(input.paletteExpressionMultiplier, "Palette expression multiplier");
  if ((input.familiarityFactor ?? 1) < 0) throw new Error("Familiarity factor cannot be negative");
  const members = new Map(input.performers.map((member) => [member.id, member]));
  if (members.size !== input.performers.length || members.size === 0) throw new Error("Performers must be unique and non-empty");
  const performerIds = new Set(members.keys());
  const parts = [...input.parts].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  if (new Set(parts.map((part) => part.id)).size !== parts.length) throw new Error("Part IDs must be unique");
  parts.forEach((part) => validatePart(part, performerIds));

  const vocalSeconds = new Map<string, Map<string, number>>();
  const danceSeconds = new Map<string, Map<string, number>>();
  for (const memberId of members.keys()) {
    vocalSeconds.set(memberId, new Map());
    danceSeconds.set(memberId, new Map());
  }
  for (const part of parts) {
    if (part.mode === "relay") for (const slice of part.relaySlices ?? []) {
      const seconds = slice.endSec - slice.startSec;
      vocalSeconds.get(slice.singerMemberId)!.set(part.id, (vocalSeconds.get(slice.singerMemberId)!.get(part.id) ?? 0) + seconds);
    }
    if (part.mode === "unison") for (const memberId of part.unisonSingerIds ?? []) vocalSeconds.get(memberId)!.set(part.id, part.durationSec);
    for (const memberId of part.dancerIds) danceSeconds.get(memberId)!.set(part.id, part.durationSec);
  }

  const failures: Omit<LocalFailureEventV12, "ordinalInSongPath" | "incrementalPenalty">[] = [];
  const failureRoll = (memberId: string, path: "vocal" | "dance", scope: "primary" | "ochi_extra", margin: number) => {
    const checkId = localFailureKey(memberId, path, scope);
    const forced = input.forcedFailures?.[checkId];
    return forced ?? (createSeededRandom(`${input.seed}:${input.liveId}:${input.songId}:${input.arrangementVersion}:${checkId}:roll`)() < failureProbabilityV12(margin));
  };
  for (const member of input.performers) {
    const vocalParts = [...vocalSeconds.get(member.id)!.entries()].map(([id, seconds]) => ({ id, seconds }));
    if (vocalParts.length > 0 && failureRoll(member.id, "vocal", "primary", member.attributes.pitch - (input.pitchRequirement ?? input.vocalDifficulty))) {
      failures.push({ memberId: member.id, path: "vocal", checkId: localFailureKey(member.id, "vocal", "primary"), checkScope: "primary", partId: weightedPartPick(`${input.seed}:${input.liveId}:${input.songId}:${input.arrangementVersion}:${member.id}:vocal:primary:placement`, vocalParts) });
    }
    const danceParts = [...danceSeconds.get(member.id)!.entries()].map(([id, seconds]) => ({ id, seconds }));
    if (danceParts.length > 0 && failureRoll(member.id, "dance", "primary", member.attributes.agility - (input.agilityRequirement ?? input.danceDifficulty))) {
      failures.push({ memberId: member.id, path: "dance", checkId: localFailureKey(member.id, "dance", "primary"), checkScope: "primary", partId: weightedPartPick(`${input.seed}:${input.liveId}:${input.songId}:${input.arrangementVersion}:${member.id}:dance:primary:placement`, danceParts) });
    }
  }
  const ochi = parts.find((part) => part.id === "ochi_sabi" && part.mode === "relay");
  const ochiSingerIds = ochi ? [...new Set((ochi.relaySlices ?? []).map((slice) => slice.singerMemberId))] : [];
  if (ochi && ochiSingerIds.length === 1) {
    const memberId = ochiSingerIds[0];
    const member = members.get(memberId)!;
    if (failureRoll(memberId, "vocal", "ochi_extra", member.attributes.pitch - (input.pitchRequirement ?? input.vocalDifficulty))) {
      failures.push({ memberId, path: "vocal", checkId: localFailureKey(memberId, "vocal", "ochi_extra"), checkScope: "ochi_extra", partId: ochi.id });
    }
  }
  const partIndex = new Map(parts.map((part, index) => [part.id, index]));
  const resolvedFailures = failures
    .sort((left, right) => left.memberId.localeCompare(right.memberId) || left.path.localeCompare(right.path) || partIndex.get(left.partId)! - partIndex.get(right.partId)! || left.checkId.localeCompare(right.checkId))
    .map((failure, index, all) => {
      const ordinal = all.slice(0, index).filter((candidate) => candidate.memberId === failure.memberId && candidate.path === failure.path).length + 1;
      const target = parts.find((part) => part.id === failure.partId)!;
      const modeMultiplier = failure.path === "vocal" && target.mode === "unison" ? performanceV12Tunable.failure.unisonPitchMultiplier : 1;
      return { ...failure, ordinalInSongPath: ordinal, incrementalPenalty: performanceV12Tunable.failure.firstPenalty * performanceV12Tunable.failure.decay ** (ordinal - 1) * modeMultiplier };
    });
  const penalties = new Map<string, number>();
  for (const failure of resolvedFailures) {
    const key = `${failure.memberId}:${failure.partId}:${failure.path}`;
    penalties.set(key, (penalties.get(key) ?? 0) + failure.incrementalPenalty);
  }

  const executions: MemberPartExecutionV12[] = [];
  const memberPerfById = Object.fromEntries(input.performers.map((member) => [member.id, 0])) as Record<string, number>;
  const partResults: PartPerformanceV12[] = [];
  for (const part of parts) {
    const singerIds = part.mode === "relay" ? [...new Set((part.relaySlices ?? []).map((slice) => slice.singerMemberId))] : part.mode === "unison" ? (part.unisonSingerIds ?? []) : [];
    const hasVocal = singerIds.length > 0;
    const hasDance = part.dancerIds.length > 0;
    const configured = performanceV12Tunable.aggregation;
    const vocalWeight = hasVocal && hasDance ? configured.vocalWeight : hasVocal ? 1 : 0;
    const danceWeight = hasVocal && hasDance ? configured.danceWeight : hasDance ? 1 : 0;
    const partMemberPerf = Object.fromEntries(input.performers.map((member) => [member.id, 0])) as Record<string, number>;
    for (const member of input.performers) {
      const vocal = vocalSeconds.get(member.id)!.get(part.id) ?? 0;
      const dance = danceSeconds.get(member.id)!.get(part.id) ?? 0;
      const base = technicalBases(member, input);
      const vocalExecution = vocal > 0 ? Math.max(performanceV12Tunable.failure.floor, base.vocal - (penalties.get(`${member.id}:${part.id}:vocal`) ?? 0)) : 0;
      const danceExecution = dance > 0 ? Math.max(performanceV12Tunable.failure.floor, base.dance - (penalties.get(`${member.id}:${part.id}:dance`) ?? 0)) : 0;
      const vocalCredit = vocal > 0 ? part.exposure * vocalWeight * (vocal / part.durationSec) * vocalExecution / (part.mode === "unison" ? singerIds.length : 1) : 0;
      const danceCredit = dance > 0 ? part.exposure * danceWeight * (dance / part.durationSec) * danceExecution / part.dancerIds.length : 0;
      executions.push({ memberId: member.id, partId: part.id, vocalSeconds: vocal, danceSeconds: dance, vocalExecution, danceExecution, vocalCredit, danceCredit });
      partMemberPerf[member.id] = vocalCredit + danceCredit;
      memberPerfById[member.id] += partMemberPerf[member.id];
    }
    const vocalTeamPerf = executions.filter((execution) => execution.partId === part.id).reduce((sum, execution) => sum + execution.vocalCredit, 0);
    const danceTeamPerf = executions.filter((execution) => execution.partId === part.id).reduce((sum, execution) => sum + execution.danceCredit, 0);
    partResults.push({ partId: part.id, teamPerf: vocalTeamPerf + danceTeamPerf, vocalTeamPerf, danceTeamPerf, memberPerfById: partMemberPerf, coverage: { vocalComplete: part.mode === "none" || (part.mode === "relay" ? (part.relaySlices ?? []).length > 0 : singerIds.length > 0), danceComplete: part.dancerIds.length > 0 } });
  }
  return {
    resultVersion: performanceV12Tunable.version,
    songAppeal: songAppealV12(input.vocalDifficulty, input.danceDifficulty),
    failures: resolvedFailures,
    memberPartExecutions: executions,
    parts: partResults,
    memberPerfById,
    teamPerf: partResults.reduce((sum, part) => sum + part.teamPerf, 0),
  };
}

export type AudienceLayerV12 = "public" | "otaku";
export type SongEnvironmentInputV12 = {
  worldPopularity: Record<Color8, number>;
  liveSaturation: Record<Color8, number>;
  teamColor: SongPalette;
  songPalette: SongPalette;
};

export type SongEnvironmentResultV12 = {
  songEnvironment: Record<AudienceLayerV12, number>;
  nextLiveSaturation: Record<Color8, number>;
};

function environmentFor(layer: AudienceLayerV12, world: number, excess: number) {
  const tuning = performanceV12Tunable.environment[layer];
  const worldResponse = clamp(1 + tuning.worldSlope * (world - 40), tuning.minWorld, tuning.maxWorld);
  const penalty = Math.min(tuning.penaltyCap, tuning.penaltyAt25 * (excess / 25) ** performanceV12Tunable.environment.penaltyExponent);
  return worldResponse * (1 - penalty);
}

export function resolveSongEnvironmentV12(input: SongEnvironmentInputV12): SongEnvironmentResultV12 {
  let teamSum = 0;
  let songSum = 0;
  for (const color of PALETTE_V21_ORDER) {
    assertFinite(input.worldPopularity[color], `World popularity ${color}`);
    assertFinite(input.liveSaturation[color], `Live saturation ${color}`);
    assertFinite(input.teamColor[color], `Team color ${color}`);
    assertFinite(input.songPalette[color], `Song color ${color}`);
    if (input.teamColor[color] < 0 || input.songPalette[color] < 0) throw new Error("Palette vectors cannot be negative");
    teamSum += input.teamColor[color];
    songSum += input.songPalette[color];
  }
  if (Math.abs(teamSum - 1) > 1e-9 || Math.abs(songSum - 1) > 1e-9) throw new Error("Team and Song Palette vectors must each sum to one");
  const songEnvironment = { public: 0, otaku: 0 } as Record<AudienceLayerV12, number>;
  const nextLiveSaturation = {} as Record<Color8, number>;
  for (const color of PALETTE_V21_ORDER) {
    const teamSat = performanceV12Tunable.environment.teamSaturationBase + input.teamColor[color] * 100;
    const excess = Math.max(0, input.liveSaturation[color] - teamSat);
    for (const layer of ["public", "otaku"] as const) songEnvironment[layer] += input.songPalette[color] * environmentFor(layer, input.worldPopularity[color], excess);
    nextLiveSaturation[color] = performanceV12Tunable.environment.liveSaturationDecay * input.liveSaturation[color] + performanceV12Tunable.environment.liveSaturationInput * input.songPalette[color] * 100;
  }
  return { songEnvironment, nextLiveSaturation };
}

export function applySongImpressionV12(performance: SongPerformanceResultV12, environment: SongEnvironmentResultV12) {
  return {
    teamImpression: {
      public: performance.teamPerf * environment.songEnvironment.public,
      otaku: performance.teamPerf * environment.songEnvironment.otaku,
    },
    memberImpressionById: Object.fromEntries(Object.entries(performance.memberPerfById).map(([memberId, memberPerf]) => [memberId, {
      public: memberPerf * environment.songEnvironment.public,
      otaku: memberPerf * environment.songEnvironment.otaku,
    }])),
  };
}
