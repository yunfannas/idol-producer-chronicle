import { createSeededRandom, sampleBinomial } from "./random";
import type { FanAttendance, FanState, LiveKind } from "./types";

export const fanChekiBalanceV1 = {
  version: "fanChekiBalanceV1",
  pOtakuAttendBase: { taiban: 0.12, oneMan: 0.32 },
  pPublicAttendBase: { taiban: 0.012, oneMan: 0.07 },
  pWeeklyPChurn: 0.008,
  pWeeklyOChurn: 0.003,
  pWeeklyAffinityChurn: 0.0015,
  pPublicToOtaku: 0.025,
  pExternalToOtaku: 0.004,
  pExternalToPublic: 0.08,
  // Calibrated after the 5/9/15-member 12-week seeded regression. This is
  // allocated by real member exposure, so roster size never multiplies it.
  pExistingOtakuToAffinity: 0.05,
  defaultNewAffinityW: 1.8,
  pStayChekiOtaku: 0.8,
  chekiMinutes: 60,
  cheki1000Seconds: 20,
  cheki2000Seconds: 40,
  cheki1000VariableCostJPY: 0,
  cheki2000VariableCostJPY: 0,
  fanChangeOverheadSeconds: 5,
  queueExtraAbandonScaleMinutes: 15,
  maxConsecutive: 2,
} as const;

export function createFanState(memberIds: string[], seed?: Partial<Pick<FanState, "publicCount" | "otakuCount">>): FanState {
  return {
    publicCount: seed?.publicCount ?? 0,
    otakuCount: seed?.otakuCount ?? 0,
    temporarilyUnassignedOtaku: 0,
    members: Object.fromEntries(memberIds.map((id) => [id, { affinityCount: 0, purchaseWeightKJPY: 0 }])),
  };
}

/** Implements v1 attendance once per event; it does not manufacture a second Cheki audience. */
export function sampleFanAttendance(input: {
  fan: FanState;
  kind: LiveKind;
  seed: string;
  attendanceImportance?: number;
  regionFactor?: number;
  weekdayFactor?: number;
  priceFactor?: number;
  recentShowCount7d?: number;
  externalWatchingAudience?: number;
}): FanAttendance {
  const eventClass = input.kind === "one-man" ? "oneMan" : "taiban";
  const multiplier = (input.attendanceImportance ?? 1) * (input.regionFactor ?? 1) * (input.weekdayFactor ?? 1) * (input.priceFactor ?? 1);
  const frequencyFactor = Math.exp(-0.12 * (input.recentShowCount7d ?? 0));
  const pO = Math.min(0.85, Math.max(0, fanChekiBalanceV1.pOtakuAttendBase[eventClass] * multiplier * frequencyFactor));
  const pP = Math.min(0.6, Math.max(0, fanChekiBalanceV1.pPublicAttendBase[eventClass] * multiplier * frequencyFactor));
  const random = createSeededRandom(input.seed);
  return {
    otaku: sampleBinomial(input.fan.otakuCount, pO, random),
    public: sampleBinomial(input.fan.publicCount, pP, random),
    external: Math.max(0, Math.round(input.externalWatchingAudience ?? 0)),
    frequencyFactor,
  };
}

/** Weekly decay applies once, preserves legal affinity bounds, and never creates Core. */
export function applyWeeklyFanDecay(fan: FanState): FanState {
  const assignedOtaku = Math.max(0, fan.otakuCount - fan.temporarilyUnassignedOtaku);
  const publicCount = fan.publicCount * (1 - fanChekiBalanceV1.pWeeklyPChurn);
  const survivingAssigned = assignedOtaku * (1 - fanChekiBalanceV1.pWeeklyOChurn);
  const temporarilyUnassignedOtaku = Math.min(fan.temporarilyUnassignedOtaku, fan.otakuCount) * (1 - fanChekiBalanceV1.pWeeklyOChurn);
  const otakuCount = survivingAssigned + temporarilyUnassignedOtaku;
  const members = Object.fromEntries(Object.entries(fan.members).map(([memberId, value]) => [memberId, {
    ...value,
    affinityCount: Math.min(survivingAssigned, value.affinityCount * (1 - fanChekiBalanceV1.pWeeklyOChurn) * (1 - fanChekiBalanceV1.pWeeklyAffinityChurn)),
  }]));
  return { publicCount, otakuCount, temporarilyUnassignedOtaku, members };
}

/**
 * Applies the documented statistical fan transition when an active member
 * graduates.  The aggregate model intentionally does not pretend to know
 * individual fan identities; it only moves the estimated unassigned portion
 * into the explicitly temporary U bucket.
 */
export function graduateMemberFanAffinity(fan: FanState, memberId: string): FanState {
  const departing = fan.members[memberId];
  if (!departing) return fan;
  const assignedOtaku = Math.max(0, fan.otakuCount - fan.temporarilyUnassignedOtaku);
  const retentionElsewhere = Object.entries(fan.members)
    .filter(([id]) => id !== memberId)
    .reduce((product, [, profile]) => product * (1 - Math.min(1, Math.max(0, profile.affinityCount / Math.max(1, assignedOtaku)))), 1);
  const uniqueLost = departing.affinityCount * retentionElsewhere;
  return {
    ...fan,
    temporarilyUnassignedOtaku: Math.min(fan.otakuCount, fan.temporarilyUnassignedOtaku + uniqueLost),
    members: {
      ...fan.members,
      [memberId]: { ...departing, affinityCount: 0 },
    },
  };
}

/** Gamma(k=2, scale=W/2), in KJPY; W is intent, never booked revenue. */
export function samplePurchaseBudgetKJPY(weightKJPY: number, random: () => number): number {
  if (weightKJPY <= 0) return 0;
  const unit = () => Math.max(Number.MIN_VALUE, random());
  return -(weightKJPY / 2) * Math.log(unit() * unit());
}

export type DemandProduct = {
  id: string;
  priceJPY: number;
  maxConsecutive?: number;
  purchaseLimit?: number;
};

/**
 * v1 product request step, before the shared queue decides actual sales.
 * ¥2,000 remains one product, not two ¥1,000 tickets.
 */
export function requestProductsForBudget(input: {
  budgetKJPY: number;
  weightKJPY: number;
  products: DemandProduct[];
  random: () => number;
}): Record<string, number> {
  const products = [...input.products].sort((left, right) => right.priceJPY - left.priceJPY);
  const minimum = Math.min(...products.map((product) => product.priceJPY));
  const result: Record<string, number> = {};
  let remainingJPY = input.budgetKJPY * 1000;
  let total = 0;
  while (remainingJPY >= minimum) {
    const twoThousand = products.find((product) => product.priceJPY === 2000);
    const oneThousand = products.find((product) => product.priceJPY === 1000);
    const p2000 = Math.min(0.6, Math.max(0.1, 0.25 + 0.08 * (input.weightKJPY - 2)));
    const selected = remainingJPY >= 2000 && twoThousand && input.random() < p2000 ? twoThousand : oneThousand ?? products.find((product) => product.priceJPY <= remainingJPY);
    if (!selected || selected.priceJPY > remainingJPY) break;
    if (selected.purchaseLimit !== undefined && (result[selected.id] ?? 0) >= selected.purchaseLimit) break;
    result[selected.id] = (result[selected.id] ?? 0) + 1;
    remainingJPY -= selected.priceJPY;
    total += 1;
    // Defensive bound only; a menu with no valid finite purchase limit must
    // still terminate based on the smallest product price.
    if (total > Math.ceil(input.budgetKJPY * 1000 / minimum) + 1) break;
  }
  return result;
}
