import { fanChekiBalanceV1 } from "./fan";

/**
 * R0 event-local conversion curves.  These are TUNABLE candidates, held in
 * one versioned surface.  They consume normalized actual satisfaction rather
 * than reusing a constant P→O rate for every performance outcome.
 */
export const r0DynamicConversionV1 = {
  version: "r0-dynamic-conversion-v1",
  memberSourceShareOfActivePublic: 0.45,
  memberSourceShareOfExternal: 0.25,
  referredPublicTeamMultiplier: 0.65,
  externalIdolMultiplier: 0.55,
  externalGeneralMultiplier: 0.35,
  live: {
    team: { base: 0.065, satisfactionSlope: 0.05, minimum: 0.025, maximum: 0.14 },
    member: { base: 0.09, satisfactionSlope: 0.06, minimum: 0.035, maximum: 0.18 },
  },
  cheki: {
    team: { base: 0.045, satisfactionSlope: 0.04, minimum: 0.015, maximum: 0.12 },
    member: { base: 0.065, satisfactionSlope: 0.05, minimum: 0.02, maximum: 0.15 },
    paidParticipation: { team: 0.20, member: 0.30, satisfactionSlope: 0.08 },
    voucherParticipation: { team: 0.30, member: 0.50 },
  },
} as const;

export type R0SourceContext = "active-public" | "referred-public" | "external-idol" | "external-general";

export function satisfactionFromPerformance(quality: number) {
  // Runtime performance quality is Team/Member Impression÷Expected clamped
  // to [.5, 1.5].  Map it once to a 0–1 satisfaction input.
  return Math.max(0, Math.min(1, quality - 0.5));
}

function curve(input: { satisfaction: number; base: number; satisfactionSlope: number; minimum: number; maximum: number }) {
  return Math.max(input.minimum, Math.min(input.maximum,
    input.base + input.satisfactionSlope * (Math.max(0, Math.min(1, input.satisfaction)) - 0.5),
  ));
}

function contextMultiplier(context: R0SourceContext) {
  if (context === "referred-public") return r0DynamicConversionV1.referredPublicTeamMultiplier;
  if (context === "external-idol") return r0DynamicConversionV1.externalIdolMultiplier;
  if (context === "external-general") return r0DynamicConversionV1.externalGeneralMultiplier;
  return 1;
}

export function teamLiveConversionProbability(teamLiveSatisfaction: number, sourceContext: R0SourceContext) {
  const tuning = r0DynamicConversionV1.live.team;
  return Math.max(0, Math.min(1, curve({ satisfaction: teamLiveSatisfaction, ...tuning }) * contextMultiplier(sourceContext)));
}

export function memberLiveConversionProbability(memberLiveSatisfaction: number, sourceContext: R0SourceContext) {
  const tuning = r0DynamicConversionV1.live.member;
  return Math.max(0, Math.min(1, curve({ satisfaction: memberLiveSatisfaction, ...tuning }) * contextMultiplier(sourceContext)));
}

export function newcomerPaidChekiParticipationProbability(satisfaction: number, source: "team" | "member") {
  const base = r0DynamicConversionV1.cheki.paidParticipation[source];
  return Math.max(0, Math.min(1, base + r0DynamicConversionV1.cheki.paidParticipation.satisfactionSlope * (satisfaction - 0.5)));
}

export function newcomerVoucherParticipationProbability(source: "team" | "member") {
  return r0DynamicConversionV1.cheki.voucherParticipation[source];
}

export function chekiInteractionSatisfaction(memberLiveSatisfaction: number, waitMinutes: number) {
  // A real completed service is mandatory.  Queue waiting modifies service
  // satisfaction; Member Appeal is intentionally absent to avoid a second
  // acquisition multiplier at conversion time.
  return Math.max(0, Math.min(1, 0.7 * memberLiveSatisfaction + 0.3 * Math.max(0, 1 - waitMinutes / 60)));
}

export function chekiConversionProbability(memberInteractionSatisfaction: number, source: "team" | "member", sourceContext: R0SourceContext) {
  const tuning = r0DynamicConversionV1.cheki[source];
  return Math.max(0, Math.min(1, curve({ satisfaction: memberInteractionSatisfaction, ...tuning }) * contextMultiplier(sourceContext)));
}

/** Legacy values remain for C0/C2 comparison only, not R0 C3 conversion. */
export const legacyFixedConversionParameters = {
  pPublicToOtaku: fanChekiBalanceV1.pPublicToOtaku,
  pExternalToOtaku: fanChekiBalanceV1.pExternalToOtaku,
};
