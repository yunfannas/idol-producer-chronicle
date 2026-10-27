import type { FanState, InterestSlots, MemberInterestState } from "./types";

export type InterestSource = "public" | "otaku";

export const fanInterestV15 = {
  version: "fan-interest-v1.5",
  slots: 4,
  maxRenewalFraction: 0.7,
} as const;

export function emptyInterestSlots(): InterestSlots {
  return [0, 0, 0, 0];
}

export function emptyMemberInterest(): MemberInterestState {
  return { public: emptyInterestSlots(), otaku: emptyInterestSlots() };
}

export function createFanInterestState(memberIds: string[]): Record<string, MemberInterestState> {
  return Object.fromEntries(memberIds.map((memberId) => [memberId, emptyMemberInterest()]));
}

export function totalInterest(slots: InterestSlots) {
  return slots.reduce((sum, value) => sum + value, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function replaceMemberInterest(fan: FanState, memberId: string, interest: MemberInterestState): FanState {
  if (!fan.members[memberId]) throw new Error(`Cannot record Interest for unknown member ${memberId}`);
  return { ...fan, interests: { ...fan.interests, [memberId]: interest } };
}

function normalizedSlots(slots: InterestSlots): InterestSlots {
  return slots.map((value) => Math.max(0, value)) as InterestSlots;
}

/** Adds newly-created Interest to this week's newest slot; it never changes P, O, A or W. */
export function addMemberInterest(fan: FanState, input: { memberId: string; source: InterestSource; amount: number }): FanState {
  const current = fan.interests[input.memberId] ?? emptyMemberInterest();
  const slots = normalizedSlots(current[input.source]);
  slots[3] += Math.max(0, input.amount);
  return replaceMemberInterest(fan, input.memberId, { ...current, [input.source]: slots });
}

/**
 * Successful broad-tokuten relationship formation consumes the available
 * interest proportionally across all four age slots. It deliberately is not
 * oldest-first FIFO redemption.
 */
export function consumeInterestProportionally(slots: InterestSlots, completedSuccessfulServices: number): InterestSlots {
  const normalized = normalizedSlots(slots);
  const available = totalInterest(normalized);
  if (available <= 0 || completedSuccessfulServices <= 0) return normalized;
  const retainedFraction = 1 - clamp(completedSuccessfulServices, 0, available) / available;
  return normalized.map((value) => value * retainedFraction) as InterestSlots;
}

function capSlots(slots: InterestSlots, cap: number): { slots: InterestSlots; clipped: number } {
  const total = totalInterest(slots);
  if (total <= cap || total <= 0) return { slots, clipped: 0 };
  const factor = Math.max(0, cap) / total;
  return { slots: slots.map((value) => value * factor) as InterestSlots, clipped: total - Math.max(0, cap) };
}

export type WeeklyInterestInput = {
  /** Source-specific renewal fractions from actual qualifying weekly exposure. */
  renewalFractions?: Partial<Record<string, Partial<Record<InterestSource, number>>>>;
  /** New exposure-created Interest. It is appended after expiry/renewal. */
  newInterest?: Partial<Record<string, Partial<Record<InterestSource, number>>>>;
};

export type WeeklyInterestAudit = Record<string, Record<InterestSource, {
  expired: number;
  renewed: number;
  lost: number;
  added: number;
  populationClipped: number;
}>>;

/**
 * Advances exactly one weekly calendar age. The oldest slot expires, an
 * exposure-authorized fraction is renewed into the newest slot, and only then
 * is new Interest appended. Population reconciliation occurs here, not during
 * an event, so event-local stale P/O snapshots are not prematurely clipped.
 */
export function settleWeeklyInterest(fan: FanState, input: WeeklyInterestInput = {}): { fan: FanState; audit: WeeklyInterestAudit } {
  let next = fan;
  const audit: WeeklyInterestAudit = {};
  for (const memberId of Object.keys(fan.members)) {
    const current = fan.interests[memberId] ?? emptyMemberInterest();
    audit[memberId] = {} as WeeklyInterestAudit[string];
    const updated = { ...current };
    for (const source of ["public", "otaku"] as const) {
      const slots = normalizedSlots(current[source]);
      const expired = slots[0];
      const renewalFraction = clamp(input.renewalFractions?.[memberId]?.[source] ?? 0, 0, fanInterestV15.maxRenewalFraction);
      const renewed = expired * renewalFraction;
      const added = Math.max(0, input.newInterest?.[memberId]?.[source] ?? 0);
      const aged: InterestSlots = [slots[1], slots[2], slots[3], renewed + added];
      const eligiblePopulation = source === "public"
        ? fan.publicCount
        : Math.max(0, fan.otakuCount - (fan.members[memberId]?.affinityCount ?? 0));
      const capped = capSlots(aged, eligiblePopulation);
      updated[source] = capped.slots;
      audit[memberId][source] = {
        expired,
        renewed,
        lost: expired - renewed,
        added,
        populationClipped: capped.clipped,
      };
    }
    next = replaceMemberInterest(next, memberId, updated);
  }
  return { fan: next, audit };
}

export type CompletedBroadTokutenService = {
  memberId: string;
  source: InterestSource;
  /** A completed physical service. Booked/reserved/abandoned requests are zero. */
  completedServices: number;
  /** Completed services which successfully formed a new relationship. */
  successfulRelationships: number;
};

export type BroadTokutenConversionAudit = {
  consumedInterestByMember: Record<string, Record<InterestSource, number>>;
  newAffinityByMember: Record<string, number>;
  publicRelationshipSuccesses: number;
  estimatedDistinctPublicServed: number;
  newOtaku: number;
};

/**
 * The v1.5-only conversion owner. Live/SNS may create Interest but cannot
 * call this with fictional completed service. Public conversions move P→O;
 * existing-O conversions add only the member relationship. W is intentionally
 * unchanged because W_trial is event-local and must not leak into persistence.
 */
export function applyCompletedBroadTokutenConversions(input: {
  fan: FanState;
  services: CompletedBroadTokutenService[];
  /** Event-local distinct-public estimate; needed because member Interest may overlap. */
  estimatedDistinctPublicServed?: number;
}): { fan: FanState; audit: BroadTokutenConversionAudit } {
  let next = input.fan;
  const additions: Record<string, number> = Object.fromEntries(Object.keys(next.members).map((memberId) => [memberId, 0]));
  const consumed: BroadTokutenConversionAudit["consumedInterestByMember"] = Object.fromEntries(Object.keys(next.members).map((memberId) => [memberId, { public: 0, otaku: 0 }]));
  let publicRelationshipSuccesses = 0;

  for (const service of input.services) {
    if (!next.members[service.memberId]) throw new Error(`Cannot convert service for unknown member ${service.memberId}`);
    const current = next.interests[service.memberId] ?? emptyMemberInterest();
    const available = totalInterest(current[service.source]);
    const successes = clamp(service.successfulRelationships, 0, Math.min(Math.max(0, service.completedServices), available));
    if (successes <= 0) continue;
    const sourceSlots = consumeInterestProportionally(current[service.source], successes);
    next = replaceMemberInterest(next, service.memberId, { ...current, [service.source]: sourceSlots });
    additions[service.memberId] += successes;
    consumed[service.memberId][service.source] += successes;
    if (service.source === "public") publicRelationshipSuccesses += successes;
  }

  const distinctPublic = clamp(input.estimatedDistinctPublicServed ?? publicRelationshipSuccesses, 0, publicRelationshipSuccesses);
  const newOtaku = Math.min(next.publicCount, distinctPublic, publicRelationshipSuccesses);
  const postOtaku = next.otakuCount + newOtaku;
  next = {
    ...next,
    publicCount: next.publicCount - newOtaku,
    otakuCount: postOtaku,
    members: Object.fromEntries(Object.entries(next.members).map(([memberId, profile]) => [memberId, {
      ...profile,
      affinityCount: Math.min(postOtaku, profile.affinityCount + (additions[memberId] ?? 0)),
    }])),
  };

  return {
    fan: next,
    audit: {
      consumedInterestByMember: consumed,
      newAffinityByMember: additions,
      publicRelationshipSuccesses,
      estimatedDistinctPublicServed: distinctPublic,
      newOtaku,
    },
  };
}
