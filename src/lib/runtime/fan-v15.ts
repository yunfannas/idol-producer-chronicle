import { addMemberInterest, applyCompletedBroadTokutenConversions, settleWeeklyInterest, totalInterest, type CompletedBroadTokutenService } from "./fan-interest";
import { createSeededRandom, sampleBinomial } from "./random";
import { settleChekiQueue, type MemberSales } from "./regression";
import type { EventAudienceAttribution } from "./audience-channels";
import type { FanState, RuntimeEvent } from "./types";

/**
 * Explicit calibration surface for the v1.5 migration. These values create
 * Interest only; none is a P→O/A probability. The design has not frozen
 * attribute-level content quality, so the adapter uses neutral quality until
 * the expanded member schema is present.
 */
export const fanLifecycleV15 = {
  version: "fan-sns-interest-broad-cheki-v1.5",
  liveInterest: {
    teamPublicPerViewer: 0.08,
    memberPublicPerViewer: 0.05,
    existingOtakuPerViewer: 0.06,
  },
  relationshipSuccessBase: 0.8,
  minServiceExperience: 0.75,
  voucherMaxFirstTrialsPerEvent: 8,
  sns: {
    postsPerMember: 4,
    recognitionInterestFromNewPublic: 0.35,
    existingPublicToInterest: 0.027,
    existingOtakuToInterest: 0.027,
    nonFollowerReach: 0.65,
    followConversion: 0.05,
    averageRenewal: 0.5,
    liveRenewalBonus: 0.05,
  },
} as const;

type MemberExposure = Record<string, { exposureProbability: number; quality: number }>;
export type V15InterestAudit = {
  publicCreatedByMember: Record<string, number>;
  otakuCreatedByMember: Record<string, number>;
  publicTrialRequestedByMember: Record<string, number>;
  otakuTrialRequestedByMember: Record<string, number>;
  publicTrialServedByMember: Record<string, number>;
  otakuTrialServedByMember: Record<string, number>;
  newAffinityByMember: Record<string, number>;
  newOtaku: number;
  newOtakuFromVoucher: number;
  newOtakuFromVoucherByMember: Record<string, number>;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const zeroes = (memberIds: string[]) => Object.fromEntries(memberIds.map((memberId) => [memberId, 0])) as Record<string, number>;

/**
 * Resolves an event under v1.5. Live viewers create Interest only. The queue
 * receives first-trial demand based on already persistent I; completed service
 * is the sole P/O/A conversion owner.
 */
export function resolveV15FanEvent(input: {
  fan: FanState;
  event: RuntimeEvent;
  attribution: EventAudienceAttribution;
  memberIds: string[];
  quality: number;
  exposure: MemberExposure;
  seed: string;
  voucher?: { enabled: boolean; serviceSeconds: number; variableCostJPY: number };
}): { fan: FanState; sales: Record<string, MemberSales>; audit: V15InterestAudit; externalExposure: number; logWByMember: Record<string, number> } {
  const random = createSeededRandom(`fan-v15:event:${input.seed}`);
  const audit: V15InterestAudit = {
    publicCreatedByMember: zeroes(input.memberIds), otakuCreatedByMember: zeroes(input.memberIds),
    publicTrialRequestedByMember: zeroes(input.memberIds), otakuTrialRequestedByMember: zeroes(input.memberIds),
    publicTrialServedByMember: zeroes(input.memberIds), otakuTrialServedByMember: zeroes(input.memberIds),
    newAffinityByMember: zeroes(input.memberIds), newOtaku: 0, newOtakuFromVoucher: 0, newOtakuFromVoucherByMember: zeroes(input.memberIds),
  };
  let fan = input.fan;
  const q = clamp(input.quality, 0.5, 1.5);
  const publicViewers = input.attribution.ownedPublicWatching + input.attribution.externalIdolWatching + input.attribution.externalGeneralWatching;
  const otakuViewers = input.attribution.ownedOtakuWatching;

  // Team-oriented volume is distributed by actual member Impression/exposure;
  // a weak team lowers volume but cannot erase the event-local member source.
  for (const memberId of input.memberIds) {
    const memberQ = clamp(input.exposure[memberId]?.quality ?? q, 0.5, 1.5);
    const share = clamp(input.exposure[memberId]?.exposureProbability ?? 1 / Math.max(1, input.memberIds.length), 0, 1);
    const publicInterest = sampleBinomial(
      publicViewers,
      clamp((fanLifecycleV15.liveInterest.teamPublicPerViewer * q + fanLifecycleV15.liveInterest.memberPublicPerViewer * memberQ) * share, 0, 1),
      random,
    );
    const availableOtaku = Math.max(0, otakuViewers - Math.min(otakuViewers, fan.members[memberId]?.affinityCount ?? 0));
    const otakuInterest = sampleBinomial(
      availableOtaku,
      clamp(fanLifecycleV15.liveInterest.existingOtakuPerViewer * memberQ * share, 0, 1),
      random,
    );
    if (publicInterest > 0) fan = addMemberInterest(fan, { memberId, source: "public", amount: publicInterest });
    if (otakuInterest > 0) fan = addMemberInterest(fan, { memberId, source: "otaku", amount: otakuInterest });
    audit.publicCreatedByMember[memberId] = publicInterest;
    audit.otakuCreatedByMember[memberId] = otakuInterest;
  }

  const publicAttendanceRate = input.attribution.ownedPublicWatching / Math.max(1, input.fan.publicCount);
  const otakuAttendanceRate = input.attribution.ownedOtakuWatching / Math.max(1, input.fan.otakuCount);
  const requests: { id: string; memberId: string; source: "public" | "external" }[] = [];
  const voucherRequests: { id: string; memberId: string; source: "public" | "external" }[] = [];
  const sourceByRequestId = new Map<string, "public" | "otaku">();
  let remainingVoucherFirstTrials = input.voucher?.enabled ? fanLifecycleV15.voucherMaxFirstTrialsPerEvent : 0;
  if (input.event.chekiAllowed) {
    for (const memberId of input.memberIds) {
      const publicEligible = Math.min(totalInterest(fan.interests[memberId].public), fan.publicCount);
      const otakuEligible = Math.min(totalInterest(fan.interests[memberId].otaku), Math.max(0, fan.otakuCount - fan.members[memberId].affinityCount));
      const publicRequests = sampleBinomial(Math.round(publicEligible), clamp(publicAttendanceRate, 0, 1), random);
      const otakuRequests = sampleBinomial(Math.round(otakuEligible), clamp(otakuAttendanceRate, 0, 1), random);
      audit.publicTrialRequestedByMember[memberId] = publicRequests;
      audit.otakuTrialRequestedByMember[memberId] = otakuRequests;
      for (let index = 0; index < publicRequests; index += 1) {
        const id = `v15:${input.event.id}:p:${memberId}:${index}`;
        requests.push({ id, memberId, source: "public" });
        sourceByRequestId.set(id, "public");
      }
      for (let index = 0; index < otakuRequests; index += 1) {
        const id = `v15:${input.event.id}:o:${memberId}:${index}`;
        requests.push({ id, memberId, source: "external" });
        sourceByRequestId.set(id, "otaku");
      }
      // A v1.5 voucher is an explicitly authorized, limited extra free
      // service for people who were predicted to attend but did not request
      // the paid first trial. It is not a second participation probability.
      const unpaidPublic = Math.max(0, Math.floor(publicEligible) - publicRequests);
      const issued = input.voucher?.enabled ? Math.min(remainingVoucherFirstTrials, unpaidPublic) : 0;
      remainingVoucherFirstTrials -= issued;
      for (let index = 0; index < issued; index += 1) {
        const id = `v15:${input.event.id}:voucher:${memberId}:${index}`;
        voucherRequests.push({ id, memberId, source: "public" });
        sourceByRequestId.set(id, "public");
      }
    }
  }

  const served: CompletedBroadTokutenService[] = [];
  const sales = settleChekiQueue({
    fan,
    memberIds: input.memberIds,
    attendeeOtaku: input.attribution.ownedOtakuWatching,
    seed: `${input.seed}:queue`,
    allowSales: input.event.chekiAllowed,
    // First-trial Interest requests are ordinary paid ¥1,000 services and
    // share real capacity with established A/W customers.
    paidNewcomerRequests: { requests },
    freeNewcomerTrials: input.voucher?.enabled ? {
      requests: voucherRequests,
      serviceSeconds: input.voucher.serviceSeconds,
      variableCostJPY: input.voucher.variableCostJPY,
    } : undefined,
    exposureProbabilityByMember: Object.fromEntries(input.memberIds.map((memberId) => [memberId, input.exposure[memberId]?.exposureProbability ?? 0])),
    onService: (record) => {
      if (record.kind !== "paid-newcomer" && record.kind !== "free-trial") return;
      const voucher = record.kind === "free-trial";
      const requestId = record.fanId.replace(voucher ? /^trial:/ : /^newcomer:/, "");
      const source = sourceByRequestId.get(requestId);
      if (!source) return;
      const memberQ = clamp(input.exposure[record.memberId]?.quality ?? q, 0.5, 1.5);
      const serviceExperience = clamp(1 - record.waitMinutes / 180, fanLifecycleV15.minServiceExperience, 1);
      const success = random() < clamp(fanLifecycleV15.relationshipSuccessBase * memberQ * serviceExperience, 0, 1);
      served.push({ memberId: record.memberId, source, completedServices: 1, successfulRelationships: success ? 1 : 0 });
      if (voucher && success) {
        audit.newOtakuFromVoucher += 1;
        audit.newOtakuFromVoucherByMember[record.memberId] += 1;
      }
      if (source === "public") audit.publicTrialServedByMember[record.memberId] += 1;
      else audit.otakuTrialServedByMember[record.memberId] += 1;
    },
  });
  const publicServed = served.filter((service) => service.source === "public").length;
  const converted = applyCompletedBroadTokutenConversions({ fan, services: served, estimatedDistinctPublicServed: publicServed });
  fan = converted.fan;
  audit.newAffinityByMember = converted.audit.newAffinityByMember;
  audit.newOtaku = converted.audit.newOtaku;
  const logWByMember = Object.fromEntries(input.memberIds.map((memberId) => {
    const queue = sales[memberId];
    const servedFraction = queue.buyerCount / Math.max(1, queue.affinityVisitors);
    const lostFraction = queue.queueLostBuyers / Math.max(1, queue.affinityVisitors);
    return [memberId, clamp(0.015 * servedFraction * (q - 1) - 0.01 * lostFraction, -0.05, 0.05)];
  }));
  return { fan, sales, audit, externalExposure: input.attribution.externalExposure, logWByMember };
}

/** Weekly SNS/follower/Interest settlement. It is deliberately one exposure pipeline. */
export function settleV15WeeklySns(input: {
  fan: FanState;
  memberIds: string[];
  newPublic: number;
  /** Set when the weekly P ledger has already booked this deduplicated fact. */
  publicAlreadyApplied?: boolean;
  existingPublicReach: number;
  hadLiveExposure: boolean;
  seed: string;
}): { fan: FanState; newFollowerByMember: Record<string, number>; newTeamFollowers: number } {
  const random = createSeededRandom(`fan-v15:sns:${input.seed}`);
  const memberIds = input.memberIds.filter((memberId) => input.fan.members[memberId]);
  let fan: FanState = {
    ...input.fan,
    publicCount: input.fan.publicCount + (input.publicAlreadyApplied ? 0 : Math.max(0, input.newPublic)),
  };
  const followerByMember = zeroes(memberIds);
  const perMemberReach = input.existingPublicReach / Math.max(1, memberIds.length);
  for (const memberId of memberIds) {
    const newPublicInterest = input.newPublic / Math.max(1, memberIds.length) * fanLifecycleV15.sns.recognitionInterestFromNewPublic;
    const existingPublicInterest = perMemberReach * fanLifecycleV15.sns.existingPublicToInterest
      * Math.max(0, 1 - totalInterest(fan.interests[memberId].public) / Math.max(1, fan.publicCount));
    const availableOtaku = Math.max(0, fan.otakuCount - fan.members[memberId].affinityCount);
    const existingOtakuInterest = Math.min(availableOtaku, perMemberReach * fanLifecycleV15.sns.existingOtakuToInterest);
    fan = addMemberInterest(fan, { memberId, source: "public", amount: newPublicInterest + existingPublicInterest });
    fan = addMemberInterest(fan, { memberId, source: "otaku", amount: existingOtakuInterest });
    followerByMember[memberId] = sampleBinomial(Math.round(perMemberReach * fanLifecycleV15.sns.nonFollowerReach), fanLifecycleV15.sns.followConversion, random);
  }
  const newTeamFollowers = sampleBinomial(Math.round(input.existingPublicReach * fanLifecycleV15.sns.nonFollowerReach), fanLifecycleV15.sns.followConversion, random);
  fan = {
    ...fan,
    followers: {
      team: fan.followers.team + newTeamFollowers,
      members: Object.fromEntries(Object.entries(fan.followers.members).map(([memberId, followers]) => [memberId, followers + (followerByMember[memberId] ?? 0)])),
    },
  };
  const renewal = clamp(fanLifecycleV15.sns.averageRenewal + (input.hadLiveExposure ? fanLifecycleV15.sns.liveRenewalBonus : 0), 0, 0.7);
  return {
    fan: settleWeeklyInterest(fan, { renewalFractions: Object.fromEntries(memberIds.map((memberId) => [memberId, { public: renewal, otaku: renewal }])) }).fan,
    newFollowerByMember: followerByMember,
    newTeamFollowers,
  };
}
