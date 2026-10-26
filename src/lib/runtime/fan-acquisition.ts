import { createSeededRandom, sampleBinomial } from "./random";

/**
 * Provisional, observable v1.1 SNS acquisition surface.  These are
 * implementation candidates, not historical audience measurements.  The
 * Runtime keeps only P/O/A/W/U; all reach and repeat values are weekly audit
 * facts and short-lived promotion signals.
 */
export const staffOnlineAcquisitionV11 = {
  version: "staff-online-acquisition-v1.1",
  crossChannelUniqueRetention: 0.7,
  recognitionBaseRate: 0.035,
  recognitionQualityWeight: 0.012,
  promotionSignalDecay: 0.55,
  promotionSignalReachDivisor: 1_200,
  channels: {
    officialTwitter: { contentCount: 3, impressionsPerContent: 115, uniqueRate: 0.62, newUnknownShare: 0.7, existingPublicReachRate: 0.2, engagementQuality: 0.9 },
    memberTwitterAggregate: { contentCount: 6, impressionsPerContent: 72, uniqueRate: 0.58, newUnknownShare: 0.62, existingPublicReachRate: 0.23, engagementQuality: 0.82 },
    youtube: { contentCount: 1, impressionsPerContent: 190, uniqueRate: 0.68, newUnknownShare: 0.78, existingPublicReachRate: 0.12, engagementQuality: 0.95 },
    blog: { contentCount: 2, impressionsPerContent: 64, uniqueRate: 0.6, newUnknownShare: 0.5, existingPublicReachRate: 0.3, engagementQuality: 0.76 },
  },
} as const;

export type OnlineChannel = keyof typeof staffOnlineAcquisitionV11.channels;
export type OnlineChannelAudit = {
  channel: OnlineChannel;
  contentCount: number;
  impressions: number;
  uniqueReachEstimated: number;
  newToTeamReachEstimated: number;
  existingPublicReachEstimated: number;
  repeatReachEstimated: number;
  engagementQuality: number;
  newPublicAttributed: number;
};

export type WeeklyOnlineAcquisition = {
  weekEnd: string;
  channels: OnlineChannelAudit[];
  uniqueNewUnknownReach: number;
  newPublic: number;
  /** New P attributed to event-local external exposure after weekly dedup. */
  externalNewPublic: number;
  existingPublicReach: number;
  promotionSignal: number;
};

export function resolveWeeklyOnlineAcquisition(input: {
  weekEnd: string;
  publicCount: number;
  otakuCount: number;
  activeMembers: number;
  performanceQuality: number;
  previousPromotionSignal: number;
  /** Non-O external viewers accumulated from this week's public Lives. */
  externalNewUnknownReach?: number;
  seed: string;
}): WeeklyOnlineAcquisition {
  const config = staffOnlineAcquisitionV11;
  const random = createSeededRandom(`staff-online:${input.seed}:${input.weekEnd}`);
  const quality = Math.max(0.5, Math.min(1.5, input.performanceQuality));
  const audienceScale = Math.max(0.7, Math.min(1.35, 0.7 + input.activeMembers / 30));
  const saturation = Math.max(0.35, 1 - (input.publicCount + input.otakuCount) / 12_000);
  const preChannels = (Object.keys(config.channels) as OnlineChannel[]).map((channel) => {
    const tuning = config.channels[channel];
    const contentCount = tuning.contentCount;
    const impressions = Math.round(contentCount * tuning.impressionsPerContent * audienceScale * (0.9 + quality * 0.1));
    const uniqueReachEstimated = Math.min(impressions, Math.round(impressions * tuning.uniqueRate));
    const newToTeamReachEstimated = Math.round(uniqueReachEstimated * tuning.newUnknownShare * saturation);
    const existingPublicReachEstimated = Math.min(Math.floor(input.publicCount), Math.round(input.publicCount * tuning.existingPublicReachRate));
    return { channel, contentCount, impressions, uniqueReachEstimated, newToTeamReachEstimated, existingPublicReachEstimated, repeatReachEstimated: Math.max(0, impressions - uniqueReachEstimated), engagementQuality: tuning.engagementQuality };
  });
  const rawChannelReach = preChannels.reduce((total, channel) => total + channel.newToTeamReachEstimated, 0);
  const rawExternalReach = Math.max(0, Math.floor(input.externalNewUnknownReach ?? 0));
  const rawNewReach = rawChannelReach + rawExternalReach;
  const uniqueNewUnknownReach = Math.round(rawNewReach * config.crossChannelUniqueRetention);
  const qualityWeighted = (
    preChannels.reduce((total, channel) => total + channel.engagementQuality * channel.newToTeamReachEstimated, 0)
    + rawExternalReach * quality
  ) / Math.max(1, rawNewReach);
  const recognitionRate = Math.max(0, Math.min(1, config.recognitionBaseRate + config.recognitionQualityWeight * (qualityWeighted * quality - 1)));
  const newPublic = sampleBinomial(uniqueNewUnknownReach, recognitionRate, random);
  // This is a weekly source attribution only. It does not persist a fan ID
  // and is deliberately assigned after cross-source deduplication.
  const externalNewPublic = rawNewReach > 0
    ? sampleBinomial(newPublic, rawExternalReach / rawNewReach, random)
    : 0;
  let remainingNewPublic = newPublic - externalNewPublic;
  const channels = preChannels.map((channel, index) => {
    const isLast = index === preChannels.length - 1;
    const share = rawChannelReach > 0 ? channel.newToTeamReachEstimated / rawChannelReach : 0;
    const attributed = isLast ? remainingNewPublic : Math.min(remainingNewPublic, Math.round((newPublic - externalNewPublic) * share));
    remainingNewPublic -= attributed;
    return { ...channel, newPublicAttributed: attributed };
  });
  const existingPublicReach = channels.reduce((total, channel) => total + channel.existingPublicReachEstimated, 0);
  const promotionSignal = Math.max(0, Math.min(0.4,
    input.previousPromotionSignal * config.promotionSignalDecay + existingPublicReach / Math.max(config.promotionSignalReachDivisor, input.publicCount * 3),
  ));
  return { weekEnd: input.weekEnd, channels, uniqueNewUnknownReach, newPublic, externalNewPublic, existingPublicReach, promotionSignal };
}

/** Explicit provisional demand fixtures. They are never capacity residuals. */
export const staffExternalAudienceDemandV11 = {
  version: "staff-external-audience-demand-v1.1",
  byKind: {
    debut: { watchers: 52, idolShare: 0.62 },
    taiban: { watchers: 24, idolShare: 0.68 },
    freeMall: { watchers: 70, idolShare: 0.12 },
    experimentalRegular: { watchers: 10, idolShare: 0.4 },
    regular: { watchers: 8, idolShare: 0.35 },
    graduation: { watchers: 18, idolShare: 0.5 },
    oneMan: { watchers: 4, idolShare: 0.3 },
    festival: { watchers: 48, idolShare: 0.72 },
  },
} as const;

