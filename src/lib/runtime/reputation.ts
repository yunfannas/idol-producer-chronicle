/**
 * Fan Lifecycle × Cheki × Reputation Integrated Spec v1.0.
 *
 * The Runtime deliberately keeps unavailable Live/Music evidence nullable:
 * absence of a calibrated measurement is not evidence of a zero score.
 */
export type ReputationTier = "E-" | "E" | "E+" | "D-" | "D" | "D+" | "C-" | "C" | "C+" | "B-" | "B" | "B+" | "A-" | "A" | "A+" | "S-" | "S";

export type ReputationState = {
  current: number;
  brand: number;
  live: number | null;
  music: number | null;
  visibleToPlayer: boolean;
  settledWeekIds: string[];
  appliedBrandEventIds: string[];
  pendingBrandGains: number;
};

export const reputationIntegratedV1 = {
  version: "fan-reputation-integrated-v1",
  prior: 800,
  initialBrand: 1200,
  weeklyBrandRetention: 0.995 ** (12 / 52),
  weeklyConvergence: 0.25,
  weeklyMaximumChange: 100,
  musicProductionQualityPrior: 0.5,
} as const;

const TIER_BANDS: readonly [ReputationTier, number, number][] = [
  ["E-", 0, 299], ["E", 300, 599], ["E+", 600, 799], ["D-", 800, 1199], ["D", 1200, 1599], ["D+", 1600, 1999],
  ["C-", 2000, 2399], ["C", 2400, 2999], ["C+", 3000, 3599], ["B-", 3600, 4199], ["B", 4200, 4899], ["B+", 4900, 5599],
  ["A-", 5600, 6399], ["A", 6400, 7199], ["A+", 7200, 7999], ["S-", 8000, 8999], ["S", 9000, 10000],
];

export function reputationTier(score: number): ReputationTier {
  const bounded = Math.max(0, Math.min(10_000, score));
  return TIER_BANDS.find(([, minimum, maximum]) => bounded >= minimum && bounded <= maximum)?.[0] ?? "S";
}

export function createReputationState(): ReputationState {
  return {
    current: reputationIntegratedV1.prior,
    brand: reputationIntegratedV1.initialBrand,
    live: null,
    music: null,
    visibleToPlayer: false,
    settledWeekIds: [],
    appliedBrandEventIds: [],
    pendingBrandGains: 0,
  };
}

function interpolate(value: number, anchors: readonly [number, number][]) {
  if (value <= anchors[0][0]) return anchors[0][1];
  for (let index = 1; index < anchors.length; index += 1) {
    const [rightValue, rightScore] = anchors[index];
    const [leftValue, leftScore] = anchors[index - 1];
    if (value <= rightValue) {
      const ratio = (value - leftValue) / Math.max(1, rightValue - leftValue);
      return leftScore + (rightScore - leftScore) * ratio;
    }
  }
  return anchors.at(-1)![1];
}

/**
 * Provisional continuous Live mapping for actual rolling contract receipts.
 * It keeps the v1 D− ¥1–3m anchor continuous (¥2m -> ~1100) and applies a
 * conservative average-attendance cap, rather than using a tier midpoint.
 */
export function scoreLiveReputation(input: {
  ticketGrossJPY: number;
  averageActualAttendance: number;
  attributableShowCount: number;
}): number | null {
  if (!Number.isFinite(input.ticketGrossJPY) || !Number.isFinite(input.averageActualAttendance) || input.attributableShowCount <= 0) return null;
  const grossScore = interpolate(Math.max(0, input.ticketGrossJPY), [
    [0, 0], [200_000, 300], [500_000, 600], [1_000_000, 800], [2_000_000, 1_100], [3_000_000, 1_199],
    [5_000_000, 1_200], [10_000_000, 1_599], [25_000_000, 1_999], [60_000_000, 2_399], [150_000_000, 2_999], [250_000_000, 3_599],
  ]);
  const attendanceCap = input.averageActualAttendance < 10 ? 599
    : input.averageActualAttendance < 30 ? 799
      : input.averageActualAttendance < 80 ? 1_199
        : input.averageActualAttendance < 150 ? 1_599
          : 10_000;
  return Math.round(Math.max(0, Math.min(attendanceCap, grossScore)));
}

/**
 * Two player originals are public after debut. Before a direct production
 * assessment is available, the neutral production prior is combined with
 * measured Live reception; it is an explicit TUNABLE prior, never a zero.
 */
export function scoreMusicReputation(input: {
  publishedOriginalCount: number;
  meanReceptionQuality: number | null;
  productionQualityPrior?: number;
}): number | null {
  const count = Math.max(0, Math.min(3, Math.floor(input.publishedOriginalCount)));
  if (count === 0) return null;
  const production = Math.max(0, Math.min(1, input.productionQualityPrior ?? reputationIntegratedV1.musicProductionQualityPrior));
  const reception = Math.max(0, Math.min(1, input.meanReceptionQuality ?? production));
  const quality = 0.7 * production + 0.3 * reception;
  const repertoireBonus = count === 1 ? 150 : count === 2 ? 250 : 300;
  return Math.round(Math.max(0, Math.min(10_000, 800 + repertoireBonus + 400 * (quality - 0.5))));
}

/** Applies an announced/completed Brand fact once, before that Sunday's smoothing. */
export function applyBrandEvent(input: { state: ReputationState; eventId: string; gain: number }): ReputationState {
  if (input.state.appliedBrandEventIds.includes(input.eventId)) return input.state;
  return {
    ...input.state,
    pendingBrandGains: input.state.pendingBrandGains + Math.max(0, input.gain),
    appliedBrandEventIds: [...input.state.appliedBrandEventIds, input.eventId],
  };
}

function daysBetween(start: string, end: string) {
  return Math.max(0, Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000));
}

/**
 * Runs exactly once on a JST Sunday. Unknown dimension scores retain the
 * previous comprehensive score for target construction; they are never
 * silently coerced to zero.
 */
export function settleWeeklyReputation(input: {
  state: ReputationState;
  weekEnd: string;
  debutDate: string;
  live: number | null;
  music: number | null;
  earlyMusicPotentialDelta?: number;
  earlySnsDelta?: number;
}): ReputationState {
  if (input.state.settledWeekIds.includes(input.weekEnd)) return input.state;
  const brand = Math.max(0, Math.min(10_000,
    input.state.brand * reputationIntegratedV1.weeklyBrandRetention + input.state.pendingBrandGains,
  ));
  const ageMonths = daysBetween(input.debutDate, input.weekEnd) / 30.4375;
  const earlyTarget = reputationIntegratedV1.prior + (input.earlyMusicPotentialDelta ?? 0) + (input.earlySnsDelta ?? 0);
  const targetLive = input.live ?? input.state.current;
  const targetMusic = input.music ?? input.state.current;
  const formalTarget = 0.45 * targetLive + 0.30 * targetMusic + 0.25 * brand;
  const target = ageMonths < 6
    ? earlyTarget
    : ageMonths < 12
      ? earlyTarget + (formalTarget - earlyTarget) * ((ageMonths - 6) / 6)
      : formalTarget;
  const delta = Math.max(
    -reputationIntegratedV1.weeklyMaximumChange,
    Math.min(reputationIntegratedV1.weeklyMaximumChange, reputationIntegratedV1.weeklyConvergence * (target - input.state.current)),
  );
  return {
    ...input.state,
    current: Math.max(0, Math.min(10_000, input.state.current + delta)),
    brand,
    live: input.live,
    music: input.music,
    visibleToPlayer: input.state.visibleToPlayer || input.weekEnd >= input.debutDate,
    settledWeekIds: [...input.state.settledWeekIds, input.weekEnd],
    pendingBrandGains: 0,
  };
}
