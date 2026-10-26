import { createSeededRandom, sampleBinomial } from "./random";

/**
 * C1–C3 diagnostic inputs from the 2026-10-25 acquisition handoff.
 * `externalIdolShare` is a neutral 50/50 test split because the source
 * document deliberately leaves that ratio unresolved. Nothing here is a
 * locked Scenario balance value.
 */
export const audienceChannelDiagnosticV1 = {
  version: "audience-channel-diagnostic-v1",
  publicAwarenessRate: 0.5,
  publicBuyGivenAwareRate: 0.2,
  friendBringRate: 0.1,
  referredPublicShare: 0.5,
  externalIdolShare: 0.5,
  activePublicToOtakuRate: 0.35,
  // The v1.1 contract requires a lower P_other pathway but does not yet
  // supply its candidate rate.  Keep it explicitly at zero in this fixture
  // rather than quietly reusing the active-ticket-holder rate.
  passivePublicToOtakuRate: 0,
  externalIdolToOtakuRate: 0.01,
  externalGeneralToOtakuRate: 0.004,
  externalToPublicRate: 0.08,
} as const;

export type AudienceChannelDiagnosticConfig = {
  version: string;
  publicAwarenessRate: number;
  publicBuyGivenAwareRate: number;
  friendBringRate: number;
  referredPublicShare: number;
  externalIdolShare: number;
  activePublicToOtakuRate: number;
  passivePublicToOtakuRate: number;
  externalIdolToOtakuRate: number;
  externalGeneralToOtakuRate: number;
  externalToPublicRate: number;
};

export type EventAudienceAttribution = {
  ownedOtakuWatching: number;
  ownedPublicWatching: number;
  externalIdolWatching: number;
  externalGeneralWatching: number;
  activeIntentPublicWatching: number;
  referredPublicWatching: number;
  referredExternalWatching: number;
  /** Existing P who were aware of this event before the ticket decision. */
  awarePublic: number;
  publicDemand: number;
  ticketedPublic: number;
  /** Explicit third-party/footfall demand before capacity allocation. */
  configuredExternalDemand: number;
  actualUniqueAudience: number;
  activePublicToOtaku: number;
  referredPublicToOtaku: number;
  publicToOtaku: number;
  externalIdolToOtaku: number;
  externalGeneralToOtaku: number;
  externalToPublic: number;
};

export function resolveDiagnosticAudienceChannels(input: {
  publicCount: number;
  otakuCount: number;
  capacity: number;
  /** Known actual external viewers from the event contract. Empty seats never create them. */
  externalWatchingDemand: number;
  otakuAttendanceRate: number;
  quality: number;
  seed: string;
  config?: Partial<AudienceChannelDiagnosticConfig>;
}): EventAudienceAttribution {
  const config = { ...audienceChannelDiagnosticV1, ...input.config };
  const random = createSeededRandom(`audience-channels:${input.seed}`);
  const capacity = Math.max(0, Math.floor(input.capacity));
  const publicCount = Math.max(0, Math.floor(input.publicCount));
  const otakuCount = Math.max(0, Math.floor(input.otakuCount));
  const ownedOtakuWatching = Math.min(capacity, sampleBinomial(otakuCount, Math.max(0, Math.min(1, input.otakuAttendanceRate)), random));

  // A referred public viewer is removed before ordinary awareness demand is
  // sampled, making the event-local P sources disjoint without persisting IDs.
  const friendTotal = sampleBinomial(ownedOtakuWatching, config.friendBringRate, random);
  const referredPublicWatching = Math.min(publicCount, sampleBinomial(friendTotal, config.referredPublicShare, random));
  const referredExternalWatching = friendTotal - referredPublicWatching;
  const remainingPublic = publicCount - referredPublicWatching;
  const awarePublic = sampleBinomial(remainingPublic, config.publicAwarenessRate, random);
  const activePublicDemand = sampleBinomial(awarePublic, config.publicBuyGivenAwareRate, random);
  // Active ticket buyers have priority over a referred/P-other attendee.  The
  // split is recorded after capacity allocation so a conversion is never
  // sampled from somebody who could not attend.
  const publicCapacity = Math.max(0, capacity - ownedOtakuWatching);
  const activeIntentPublicWatching = Math.min(activePublicDemand, publicCapacity);
  const referredPublicTicketed = Math.min(referredPublicWatching, publicCapacity - activeIntentPublicWatching);
  const ticketedPublic = activeIntentPublicWatching + referredPublicTicketed;
  const publicDemand = referredPublicWatching + activePublicDemand;
  const configuredExternalDemand = Math.max(0, Math.floor(input.externalWatchingDemand));
  const externalDemand = configuredExternalDemand + referredExternalWatching;
  const ticketedExternal = Math.min(externalDemand, Math.max(0, capacity - ownedOtakuWatching - ticketedPublic));
  const externalIdolWatching = sampleBinomial(ticketedExternal, config.externalIdolShare, random);
  const externalGeneralWatching = ticketedExternal - externalIdolWatching;
  const q = Math.max(0.5, Math.min(1.5, input.quality));
  // Active ticket buyers and referred/other P viewers are separate v1.1
  // populations.  The latter has no approved candidate rate yet, so the
  // diagnostic default intentionally leaves it at zero instead of treating
  // every P viewer as an active buyer.
  const activePublicToOtaku = sampleBinomial(activeIntentPublicWatching, Math.min(1, config.activePublicToOtakuRate * q), random);
  const referredPublicToOtaku = sampleBinomial(referredPublicTicketed, Math.min(1, config.passivePublicToOtakuRate * q), random);
  const publicToOtaku = activePublicToOtaku + referredPublicToOtaku;
  const externalIdolToOtaku = sampleBinomial(externalIdolWatching, Math.min(1, config.externalIdolToOtakuRate * q), random);
  const externalGeneralToOtaku = sampleBinomial(externalGeneralWatching, Math.min(1, config.externalGeneralToOtakuRate * q), random);
  const remainingExternal = ticketedExternal - externalIdolToOtaku - externalGeneralToOtaku;
  const externalToPublic = sampleBinomial(remainingExternal, Math.min(1, config.externalToPublicRate * q), random);
  return {
    ownedOtakuWatching,
    ownedPublicWatching: ticketedPublic,
    externalIdolWatching,
    externalGeneralWatching,
    activeIntentPublicWatching,
    referredPublicWatching: referredPublicTicketed,
    referredExternalWatching,
    awarePublic,
    publicDemand,
    ticketedPublic,
    configuredExternalDemand,
    actualUniqueAudience: ownedOtakuWatching + ticketedPublic + ticketedExternal,
    activePublicToOtaku,
    referredPublicToOtaku,
    publicToOtaku,
    externalIdolToOtaku,
    externalGeneralToOtaku,
    externalToPublic,
  };
}
