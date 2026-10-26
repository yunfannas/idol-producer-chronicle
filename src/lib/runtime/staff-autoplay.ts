/**
 * Persistent-calendar Staff autoplay adapter for the Chronicle prologue.
 *
 * This is deliberately a Scenario adapter, not a replacement Fan, Cheki,
 * Performance, or Finance model.  It feeds the existing kernels with a
 * versioned list of contracts and records every resulting business fact for
 * audit/report export.  All numeric contract assumptions that v0.10 leaves
 * open are kept here, labelled TUNABLE, rather than being hidden in a test.
 */
import { settleChekiSales } from "./cheki";
import { arrangementFor, createArrangementVersion, recordArrangementExposure, settleArrangementFamiliarityWeek, type FamiliaritySettlement } from "./arrangement-familiarity";
import { applyWeeklyFanDecay, createFanState, fanChekiBalanceV1 } from "./fan";
import { resolveDiagnosticAudienceChannels, type AudienceChannelDiagnosticConfig, type EventAudienceAttribution } from "./audience-channels";
import { resolveWeeklyOnlineAcquisition, staffExternalAudienceDemandV11, type WeeklyOnlineAcquisition } from "./fan-acquisition";
import { applyBrandEvent, scoreLiveReputation, scoreMusicReputation, settleWeeklyReputation } from "./reputation";
import { calculateTaibanTicketRevenue, createMonthlyOperatingReport, postLedgerEntry } from "./finance";
import {
  type CoreAttributes,
  type OperatingMember,
  prologueCoreAttributes,
  resolveOperatingPerformance,
} from "./operating-simulation";
import {
  completeMandatoryInterview,
  completeStrategyAndOriginals,
  createPrologueState,
  graduateRina,
  resolveLive,
  routeCandidateIds,
  signRoster,
} from "./prologue";
import { createSeededRandom, sampleBinomial } from "./random";
import { settleChekiQueue } from "./regression";
import { resolveKeyDuties } from "./key-duty";
import type { ChekiSettlementLine, Color8, FanState, KeyPartType, PriorityAssignment, PrologueState, ResolvedKeyDuty, RuntimeEvent, RuntimeMember } from "./types";

export type StaffAutoplayRoute = "A" | "B" | "C";
export type StaffAutoplayS3Variant = "S3-A" | "S3-B" | "S3-C";
/** v1.1 rollout stages. C0 remains the historical Runtime control. */
export type FanAcquisitionStage = "C0" | "C1" | "C2" | "C3";
export type StageStatus = "COMPLETED_TIF" | "BANKRUPT_OR_DEBT_DISTRESS" | "BLOCKED_BUG";

export const staffAutoplayScenarioV1 = {
  version: "staff-autoplay-scenario-v7-fan-audit-contracts",
  tuningVersion: "fanChekiBalanceV1-fan-acquisition-v2",
  // Source: v0.10 locks the dates and contract kinds but intentionally leaves
  // specific capacity, receipts and rent to Scenario data. These are named
  // starting calibration inputs, never result-dependent subsidies.
  normalTrainingHours: 6,
  normalTrainingRoomJPY: 15_000,
  monthlySalaryJPY: 10_000,
  taiban: { capacity: 120, sellThrough: 0.55, ticketJPY: 2_500, groups: 4, venueCostJPY: 8_000 },
  experimentalRegular: { capacity: 80, sellThrough: 0.35, ticketJPY: 1_500, venueCostJPY: 35_000 },
  regular: { capacity: 100, sellThrough: 0.38, ticketJPY: 1_500, venueCostJPY: 35_000 },
  graduation: { capacity: 160, sellThrough: 0.5, ticketJPY: 2_000, venueCostJPY: 50_000 },
  oneMan: { capacity: 300, sellThrough: 0.34, ticketJPY: 3_000, venueCostJPY: 180_000 },
  festival: { capacity: 250, sellThrough: 0.55, ticketJPY: 0, venueCostJPY: 0 },
  grades: { fanC: 120, performanceC: 0.9, businessC: 2_000_000 },
  // Performance-only calibration surface. It is applied only to actual
  // rehearsal/live Palette exposure, not to Fan, ticket, or Cheki inputs.
  performanceGrowth: { memberPalettePerHour: 0.6, livePaletteHours: 1.5, rehearsalHoursPerSong: 3, dailyConditionRecovery: 2 },
  // S3-C scenario adapter. The detailed historical prologue setlist and the
  // graduation inheritance curve are not frozen by v0.10; both are named
  // TUNABLE input, not claimed historical facts or balance bonuses.
  arrangement: {
    songId: "prologue-staff-default-song",
    initialVersion: "v1",
    graduationVersion: "v2-after-rina-graduation",
    graduationInheritanceFactor: 0.5,
    keyAssignments: [
      { keyPartId: "sabi-1", partType: "sabi_1_key_line", firstMemberId: "IPC1-001", secondMemberId: "IPC1-002", thirdMemberId: "IPC1-003" },
      { keyPartId: "bridge", partType: "bridge", firstMemberId: "IPC1-002", secondMemberId: "IPC1-001", thirdMemberId: "IPC1-004" },
      { keyPartId: "last-sabi", partType: "last_sabi", firstMemberId: "IPC1-001", secondMemberId: "IPC1-003", thirdMemberId: "IPC1-002" },
    ] satisfies PriorityAssignment[],
  },
} as const;

/**
 * TUNABLE C4 contract. It is disabled by default so existing B-route audit
 * baselines remain reproducible until its full scenario rollout is approved.
 */
export type NewcomerVoucherTrialConfig = {
  enabled: boolean;
  externalUptakeProbability: number;
  conversionProbability: number;
  serviceSeconds: number;
  variableCostJPY: number;
};
export const newcomerVoucherTrialV1: NewcomerVoucherTrialConfig = {
  enabled: false,
  externalUptakeProbability: 0.25,
  conversionProbability: 0.18,
  serviceSeconds: 20,
  variableCostJPY: 180,
};

/**
 * C2/C3 test adapter. External viewers must be supplied against a concrete
 * event id by a Scenario/contract fixture; omitted ids mean zero configured
 * external viewers, never ``capacity - owned audience``. This remains opt-in
 * until the v1.1 migration has its paired-seed calibration report.
 */
export type StaffAutoplayAudienceDemandConfig = {
  enabled: boolean;
  externalWatchingDemandByEventId: Readonly<Record<string, number>>;
  channelConfig?: Partial<AudienceChannelDiagnosticConfig>;
};

export const staffAutoplayAudienceDemandV11: StaffAutoplayAudienceDemandConfig = {
  enabled: false,
  externalWatchingDemandByEventId: {},
};

const audienceStageV11 = {
  // C2 keeps v1.0 conversion probabilities as an isolated demand-only
  // comparison. C3 switches to the explicit active-P / X-idol / X-general
  // candidates in audience-channels.ts.
  c2LegacyConversion: {
    activePublicToOtakuRate: fanChekiBalanceV1.pPublicToOtaku,
    passivePublicToOtakuRate: fanChekiBalanceV1.pPublicToOtaku,
    externalIdolToOtakuRate: fanChekiBalanceV1.pExternalToOtaku,
    externalGeneralToOtakuRate: fanChekiBalanceV1.pExternalToOtaku,
    externalToPublicRate: fanChekiBalanceV1.pExternalToPublic,
  },
} as const;

const DEFAULT_SONG_DIRECTION: Record<Color8, number> = {
  red: 0.25, pink: 0.1, orange: 0.1, aqua: 0.1, yellow: 0.1, green: 0.1, blue: 0.1, purple: 0.15,
};

export type StaffAutoplayFanSnapshot = {
  publicCount: number;
  otakuCount: number;
  temporarilyUnassignedOtaku: number;
  members: Record<string, { affinityCount: number; purchaseWeightKJPY: number }>;
};

export type StaffAutoplayEventAudit = {
  date: string;
  liveId: string;
  kind: RuntimeEvent["kind"];
  contractId: string;
  /** Venue/contract capacity, distinct from legacy contract sell-through. */
  audienceCapacity: number;
  participantIds: string[];
  expectedAttendance: number;
  actualAttendance: number;
  performanceInternal: number;
  ticketRevenueJPY: number;
  venueCostJPY: number;
  chekiGrossJPY: number;
  chekiCommissionJPY: number;
  chekiVariableCostJPY: number;
  queueLostJPY: number;
  publicCount: number;
  otakuCount: number;
  affinityTotal: number;
  cashAfterJPY: number;
  songId?: string;
  arrangementVersion?: string;
  familiarityAtLive?: number;
  paletteExecution?: { basePE: number; keyBonus: number; finalPE: number };
  resolvedDuties?: ResolvedKeyDuty[];
  /** Actual queue evidence.  No demand, coupon, or revenue is inferred from this. */
  cheki: {
    lines: ChekiSettlementLine[];
    queues: Record<string, {
      requestedUnits: number;
      completedUnits: number;
      completedUnitsByTier: { "1000": number; "2000": number };
      affinityVisitors: number;
      buyerCount: number;
      queueLostBuyers: number;
      queueLostJPY: number;
      freeTrialRequested: number;
      freeTrialServed: number;
      freeTrialLost: number;
      freeTrialVariableCostJPY: number;
    }>;
  };
  fanFlow: {
    opening: StaffAutoplayFanSnapshot;
    otakuAttendance: number;
    publicAttendance: number;
    externalAudience: number;
    /** Non-O external reach pending the combined Sunday P settlement. */
    externalExposure: number;
    publicToOtaku: number;
    externalToOtaku: number;
    externalToPublic: number;
    /** One initial affinity for each event-attributed new Otaku. */
    initialAffinityByMember: Record<string, number>;
    /** Existing assigned O gaining an additional member affinity at this Live. */
    existingOtakuAffinityByMember: Record<string, number>;
    freeTrialRequested: number;
    freeTrialServed: number;
    freeTrialLost: number;
    /** A subset of external→O: only completed free newcomer services may enter here. */
    freeTrialConversionsByMember: Record<string, number>;
  };
  audienceAttribution?: EventAudienceAttribution;
  /** C2/C3 demand does not alter the pre-existing Scenario ticket contract. */
  ticketSettlementSource: "scenario-contract";
};

export type StaffAutoplayFanMonth = {
  month: string;
  opening: StaffAutoplayFanSnapshot;
  closing: StaffAutoplayFanSnapshot;
  eventFlow: {
    otakuAttendance: number;
    publicAttendance: number;
    externalAudience: number;
    externalExposure: number;
    publicToOtaku: number;
    externalToOtaku: number;
    externalToPublic: number;
  };
  weeklyChurn: { publicCount: number; otakuCount: number; affinityTotal: number };
};

export type StaffAutoplayMonth = {
  month: string;
  openingCash: number;
  closingCash: number;
  operatingRevenue: number;
  operatingCost: number;
  capitalizedAssets: number;
  loans: number;
  note: string;
  publicCount: number;
  otakuCount: number;
  activeRoster: number;
  eventCount: number;
  minCash: number;
};

export type StaffAutoplayResult = {
  route: StaffAutoplayRoute;
  seed: number;
  runId: string;
  scenarioVersion: string;
  s3Variant: StaffAutoplayS3Variant;
  tuningVersion: string;
  fanAcquisitionStage: FanAcquisitionStage;
  stageStatus: StageStatus;
  state: PrologueState;
  events: StaffAutoplayEventAudit[];
  fanMonths: StaffAutoplayFanMonth[];
  fanWeeklyResolutions: WeeklyFanResolution[];
  onlineWeeks: WeeklyOnlineAcquisition[];
  familiaritySettlements: ({ weekEnd: string } & FamiliaritySettlement)[];
  months: StaffAutoplayMonth[];
  minCash: number;
  grades: { fans: string; performance: string; business: string; overall: string };
  memberDevelopment: Record<string, { active: boolean; condition: number; trainingHours: number; paletteMean: number; palette: Record<Color8, number> }>;
};

type MonthSnapshot = { publicCount: number; otakuCount: number; activeRoster: number };

type PendingFanMomentum = {
  eventId: string;
  auditIndex: number;
  publicToOtakuSampled: number;
  externalToOtaku: number;
  externalToPublic: number;
  externalExposure: number;
  assignInitialAffinityToNewOtaku: boolean;
  newAffinityByMember: Record<string, number>;
  initialAffinityByMember: Record<string, number>;
  logWByMember: Record<string, number>;
  memberWeights: Record<string, number>;
};

type WeeklyFanResolution = {
  weekEnd: string;
  eventIds: string[];
  publicToOtaku: number;
  externalToOtaku: number;
  externalToPublic: number;
  externalExposure: number;
  onlineNewPublic: number;
  opening: StaffAutoplayFanSnapshot;
  closing: StaffAutoplayFanSnapshot;
};

function trailingReputationEvidence(events: StaffAutoplayEventAudit[], asOf: string) {
  const cutoff = `${Number(asOf.slice(0, 4)) - 1}${asOf.slice(4)}`;
  const trailing = events.filter((event) => event.date >= cutoff);
  return {
    ticketGrossJPY: trailing.reduce((sum, event) => sum + event.ticketRevenueJPY, 0),
    averageActualAttendance: trailing.reduce((sum, event) => sum + event.actualAttendance, 0) / Math.max(1, trailing.length),
    attributableShowCount: trailing.length,
    meanReceptionQuality: trailing.length > 0
      ? trailing.reduce((sum, event) => sum + Math.max(0, Math.min(1, event.performanceInternal)), 0) / trailing.length
      : null,
  };
}

function snapshotFan(fan: FanState): StaffAutoplayFanSnapshot {
  return {
    publicCount: fan.publicCount,
    otakuCount: fan.otakuCount,
    temporarilyUnassignedOtaku: fan.temporarilyUnassignedOtaku,
    members: Object.fromEntries(Object.entries(fan.members).map(([memberId, profile]) => [memberId, { ...profile }])),
  };
}

const C_NEWCOMERS: (RuntimeMember & { attributes: CoreAttributes })[] = [
  ["C2-001", "秋月澪", { agility: 13, naturalFitness: 13, stamina: 13, pitch: 13, tone: 12, breath: 12, rhythm: 13, power: 12, stagePresence: 13 }],
  ["C2-002", "柏木真帆", { agility: 14, naturalFitness: 14, stamina: 14, pitch: 11, tone: 12, breath: 12, rhythm: 14, power: 14, stagePresence: 14 }],
  ["C2-003", "東雲栞", { agility: 12, naturalFitness: 13, stamina: 12, pitch: 14, tone: 15, breath: 14, rhythm: 13, power: 11, stagePresence: 13 }],
  ["C2-004", "真壁杏奈", { agility: 13, naturalFitness: 12, stamina: 13, pitch: 12, tone: 13, breath: 12, rhythm: 14, power: 13, stagePresence: 14 }],
  ["C2-005", "早川結衣", { agility: 12, naturalFitness: 12, stamina: 13, pitch: 13, tone: 14, breath: 13, rhythm: 12, power: 12, stagePresence: 12 }],
  ["C2-006", "水原彩葉", { agility: 15, naturalFitness: 14, stamina: 14, pitch: 12, tone: 11, breath: 12, rhythm: 15, power: 15, stagePresence: 15 }],
].map(([id, nameJa, attributes]) => ({
  id: id as string, nameJa: nameJa as string, active: true, contractEndsOn: "2015-10-01", chekiCommissionRate: 0.2,
  monthlySalary: staffAutoplayScenarioV1.monthlySalaryJPY, fitnessCondition: 100,
  developedPalette: { red: 0, pink: 0, orange: 0, aqua: 0, yellow: 0, green: 0, blue: 0, purple: 0 },
  // The adapter keeps its operational attributes separately; this tagged
  // property is stripped by operatingMember().
  attributes: attributes as CoreAttributes,
})) as (RuntimeMember & { attributes: CoreAttributes })[];

function nextDate(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function weekEnds(date: string) { return new Date(`${date}T00:00:00Z`).getUTCDay() === 0; }

function operatingMember(member: RuntimeMember): OperatingMember {
  const newcomer = C_NEWCOMERS.find((candidate) => candidate.id === member.id);
  const attributes = newcomer?.attributes ?? prologueCoreAttributes[member.id];
  if (!attributes) throw new Error(`Missing approved performance attributes for ${member.id}`);
  return { ...member, attributes, palette: member.developedPalette ?? { red: 0, pink: 0, orange: 0, aqua: 0, yellow: 0, green: 0, blue: 0, purple: 0 }, trainingExp: 0 };
}

function rosterForRoute(route: StaffAutoplayRoute) {
  if (route === "A") return routeCandidateIds(15);
  if (route === "B") return routeCandidateIds(9);
  return [];
}

function post(state: PrologueState, entry: Parameters<typeof postLedgerEntry>[1]): PrologueState {
  return { ...state, finance: postLedgerEntry(state.finance, entry) };
}

function eligibleLineup(members: OperatingMember[]): OperatingMember[] {
  if (members.length <= 10) return members;
  return [...members].sort((left, right) => right.fitnessCondition - left.fitnessCondition || left.id.localeCompare(right.id)).slice(0, 10);
}

function contractFor(event: RuntimeEvent, seed: string) {
  const random = createSeededRandom(`staff-autoplay:${seed}:${event.id}:contract`);
  const sampled = (input: { capacity: number; sellThrough: number; ticketJPY: number; venueCostJPY: number }) => {
    const attendees = sampleBinomial(input.capacity, input.sellThrough, random);
    return { capacity: input.capacity, attendees, receipts: attendees * input.ticketJPY, venueCostJPY: input.venueCostJPY };
  };
  if (event.kind === "debut") return { capacity: 1_000, attendees: sampled({ capacity: 1_000, sellThrough: 0.08, ticketJPY: 0, venueCostJPY: 0 }).attendees, receipts: 0, venueCostJPY: 0 };
  if (event.kind === "free-mall") return { capacity: 180, attendees: sampled({ capacity: 180, sellThrough: 0.45, ticketJPY: 0, venueCostJPY: 0 }).attendees, receipts: 0, venueCostJPY: 0 };
  if (event.kind === "experimental-regular") return sampled(staffAutoplayScenarioV1.experimentalRegular);
  if (event.kind === "regular") return sampled(staffAutoplayScenarioV1.regular);
  if (event.kind === "graduation") return sampled(staffAutoplayScenarioV1.graduation);
  if (event.kind === "one-man") return sampled(staffAutoplayScenarioV1.oneMan);
  if (event.kind === "festival") return sampled(staffAutoplayScenarioV1.festival);
  return sampled(staffAutoplayScenarioV1.taiban);
}

function externalDemandForEvent(event: RuntimeEvent) {
  const fixture = event.kind === "free-mall" ? staffExternalAudienceDemandV11.byKind.freeMall
    : event.kind === "experimental-regular" ? staffExternalAudienceDemandV11.byKind.experimentalRegular
      : event.kind === "one-man" ? staffExternalAudienceDemandV11.byKind.oneMan
        : staffExternalAudienceDemandV11.byKind[event.kind as "debut" | "taiban" | "regular" | "graduation" | "festival"];
  return fixture ?? { watchers: 0, idolShare: 0.5 };
}

function updateFanFromEvent(input: {
  fan: FanState; participants: OperatingMember[]; event: RuntimeEvent; totalAudience: number;
  quality: number; exposure: Record<string, { exposureProbability: number; quality: number }>; seed: string;
  newcomerVoucher?: NewcomerVoucherTrialConfig;
  audienceAttribution?: EventAudienceAttribution;
  integratedLifecycle?: boolean;
}) {
  // Legacy mode derives temporary X from a contract attendance total. In
  // C2/C3 mode all audience populations come from demand attribution, so no
  // residual-capacity X is created here.
  const oneMan = eventClass(input.event.kind);
  const pOAttend = oneMan ? fanChekiBalanceV1.pOtakuAttendBase.oneMan : fanChekiBalanceV1.pOtakuAttendBase.taiban;
  const pPAttend = oneMan ? fanChekiBalanceV1.pPublicAttendBase.oneMan : fanChekiBalanceV1.pPublicAttendBase.taiban;
  const capacity = Math.max(0, Math.round(input.totalAudience));
  const attendance = input.audienceAttribution?.ownedOtakuWatching ?? Math.min(capacity, Math.round(input.fan.otakuCount), sampleBinomial(input.fan.otakuCount, pOAttend, createSeededRandom(`${input.seed}:otaku-attendance`)));
  const publicAttend = input.audienceAttribution?.ownedPublicWatching ?? Math.min(Math.max(0, capacity - attendance), sampleBinomial(input.fan.publicCount, pPAttend, createSeededRandom(`${input.seed}:public-attendance`)));
  const externalAudience = input.audienceAttribution
    ? input.audienceAttribution.externalIdolWatching + input.audienceAttribution.externalGeneralWatching
    : Math.max(0, capacity - attendance - publicAttend);
  const weights = input.participants.map((member) => Math.max(0, input.exposure[member.id]?.quality ?? 0));
  const denominator = weights.reduce((total, value) => total + value, 0);
  const voucherRandom = createSeededRandom(`${input.seed}:newcomer-voucher`);
  // C4 combines Live and voucher hazards; until that combined path is enabled,
  // C2/C3 audience demand deliberately runs without a second voucher draw.
  const voucherEnabled = input.newcomerVoucher?.enabled === true && input.event.chekiAllowed && !input.audienceAttribution;
  const voucherRequests = voucherEnabled
    ? Array.from({ length: sampleBinomial(externalAudience, input.newcomerVoucher!.externalUptakeProbability, voucherRandom) }, (_, index) => {
        let point = voucherRandom() * denominator;
        const memberIndex = input.participants.findIndex((_, position) => {
          point -= weights[position];
          return point <= 0;
        });
        return { id: `${input.event.id}:external:${index + 1}`, memberId: input.participants[Math.max(0, memberIndex)].id, source: "external" as const };
      })
    : [];
  const servedVoucherIds = new Set<string>();
  let eligible: Record<string, number> = {};
  const sales = settleChekiQueue({
    fan: input.fan, memberIds: input.participants.map((member) => member.id), attendeeOtaku: attendance,
    seed: `${input.seed}:queue`, allowSales: input.event.chekiAllowed,
    exposureProbabilityByMember: Object.fromEntries(input.participants.map((member) => [member.id, input.exposure[member.id]?.exposureProbability ?? 0])),
    freeNewcomerTrials: voucherEnabled ? {
      requests: voucherRequests,
      serviceSeconds: input.newcomerVoucher!.serviceSeconds,
      variableCostJPY: input.newcomerVoucher!.variableCostJPY,
    } : undefined,
    onService: (record) => {
      if (record.kind === "free-trial") servedVoucherIds.add(record.fanId.replace(/^trial:/, ""));
    },
    onAudience: (audience) => { eligible = audience.eligibleExposedOWithoutAffinity; },
  });
  const random = createSeededRandom(`${input.seed}:fan`);
  const q = Math.max(0.5, Math.min(1.5, input.quality));
  // Only people actually recorded as attending may convert at this event.
  // This is conditional-on-viewing conversion; never multiply attendance twice.
  const publicToO = input.audienceAttribution?.publicToOtaku ?? sampleBinomial(publicAttend, Math.min(0.2, fanChekiBalanceV1.pPublicToOtaku * q), createSeededRandom(`${input.seed}:public-conversion`));
  // Requesters are reserved from normal X conversion: a free-trial requester
  // becomes O only after a completed service, never twice in this Live.
  const externalDirectPool = Math.max(0, externalAudience - voucherRequests.length);
  const externalDirectToO = input.audienceAttribution
    ? input.audienceAttribution.externalIdolToOtaku + input.audienceAttribution.externalGeneralToOtaku
    : sampleBinomial(externalDirectPool, Math.min(0.1, fanChekiBalanceV1.pExternalToOtaku * q), random);
  const externalToP = input.audienceAttribution?.externalToPublic
    ?? sampleBinomial(externalDirectPool - externalDirectToO, Math.min(0.3, fanChekiBalanceV1.pExternalToPublic * q), random);
  const externalExposure = input.integratedLifecycle && input.audienceAttribution
    ? input.audienceAttribution.externalExposure
    : 0;
  const newByMember = Object.fromEntries(input.participants.map((member) => [member.id, 0])) as Record<string, number>;
  for (let index = 0; index < (input.integratedLifecycle ? 0 : externalDirectToO); index += 1) {
    let point = random() * denominator;
    for (let position = 0; position < input.participants.length; position += 1) {
      point -= weights[position];
      if (point <= 0 || position === input.participants.length - 1) { newByMember[input.participants[position].id] += 1; break; }
    }
  }
  const freeTrialConversionsByMember = Object.fromEntries(input.participants.map((member) => [member.id, 0])) as Record<string, number>;
  for (const request of voucherRequests) {
    if (servedVoucherIds.has(request.id) && random() < Math.min(1, input.newcomerVoucher!.conversionProbability * q)) {
      freeTrialConversionsByMember[request.memberId] += 1;
      newByMember[request.memberId] += 1;
    }
  }
  const freeTrialRequested = Object.values(sales).reduce((sum, sale) => sum + sale.freeTrialRequested, 0);
  const freeTrialServed = Object.values(sales).reduce((sum, sale) => sum + sale.freeTrialServed, 0);
  const freeTrialLost = Object.values(sales).reduce((sum, sale) => sum + sale.freeTrialLost, 0);
  const voucherConversions = Object.values(freeTrialConversionsByMember).reduce((sum, value) => sum + value, 0);
  const externalToO = externalDirectToO + voucherConversions;
  const newAffinityByMember = Object.fromEntries(Object.entries(input.fan.members).map(([id]) => {
    if (!input.participants.some((member) => member.id === id)) return [id, 0];
    const share = denominator > 0 ? Math.max(0, input.exposure[id]?.quality ?? 0) / denominator : 0;
    const newAffinity = sampleBinomial(eligible[id] ?? 0, Math.min(0.12, 0.10 * share * (input.exposure[id]?.quality ?? 1)), random);
    return [id, newAffinity];
  }));
  const logWByMember = Object.fromEntries(input.participants.map((member) => {
    const queue = sales[member.id];
    const served = queue.buyerCount / Math.max(1, queue.affinityVisitors);
    const lost = queue.queueLostBuyers / Math.max(1, queue.affinityVisitors);
    return [member.id, Math.max(-0.05, Math.min(0.05, 0.015 * served * (q - 1) - 0.01 * lost))];
  }));
  return {
    sales,
    flow: {
      otakuAttendance: attendance,
      publicAttendance: publicAttend,
      externalAudience,
      externalExposure,
      publicToOtaku: 0,
      externalToOtaku: externalToO,
      externalToPublic: externalToP,
      initialAffinityByMember: newByMember,
      existingOtakuAffinityByMember: newAffinityByMember,
      freeTrialRequested,
      freeTrialServed,
      freeTrialLost,
      freeTrialConversionsByMember,
    },
    momentum: {
      publicToOtakuSampled: publicToO,
      externalToOtaku: externalToO,
      externalToPublic: externalToP,
      externalExposure,
      assignInitialAffinityToNewOtaku: !input.integratedLifecycle,
      newAffinityByMember,
      initialAffinityByMember: newByMember,
      logWByMember,
      memberWeights: Object.fromEntries(input.participants.map((member, index) => [member.id, weights[index]])),
    },
  };
}

function resolveWeeklyFanMomentum(input: {
  fan: FanState;
  momenta: PendingFanMomentum[];
  audits: StaffAutoplayEventAudit[];
  weekEnd: string;
  seed: string;
  applyDecay?: boolean;
  onlineNewPublic?: number;
  externalExposurePublic?: number;
}): { fan: FanState; resolution: WeeklyFanResolution } {
  const opening = snapshotFan(input.fan);
  const decayed = input.applyDecay === false ? input.fan : applyWeeklyFanDecay(input.fan);
  // Commit only observed event conversions. Cap by the surviving P pool;
  // per-event awards are attributed in chronological order without phantom viewers.
  const publicToOtaku = Math.min(Math.floor(decayed.publicCount), input.momenta.reduce((sum, momentum) => sum + momentum.publicToOtakuSampled, 0));
  const random = createSeededRandom(`${input.seed}:fan-week:${input.weekEnd}`);
  const externalToOtaku = input.momenta.reduce((sum, momentum) => sum + momentum.externalToOtaku, 0);
  const externalToPublic = input.momenta.reduce((sum, momentum) => sum + momentum.externalToPublic, 0)
    + (input.externalExposurePublic ?? 0);
  const additionalAffinity: Record<string, number> = Object.fromEntries(Object.keys(decayed.members).map((memberId) => [memberId, 0]));
  const logW: Record<string, number> = Object.fromEntries(Object.keys(decayed.members).map((memberId) => [memberId, 0]));
  for (const momentum of input.momenta) {
    for (const [memberId, amount] of Object.entries(momentum.newAffinityByMember)) additionalAffinity[memberId] = (additionalAffinity[memberId] ?? 0) + amount;
    for (const [memberId, amount] of Object.entries(momentum.initialAffinityByMember)) additionalAffinity[memberId] = (additionalAffinity[memberId] ?? 0) + amount;
    for (const [memberId, amount] of Object.entries(momentum.logWByMember)) logW[memberId] = (logW[memberId] ?? 0) + amount;
  }
  const choose = <T,>(items: T[], weight: (item: T) => number) => {
    const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
    if (total <= 0) return items[0];
    let point = random() * total;
    for (const item of items) {
      point -= Math.max(0, weight(item));
      if (point <= 0) return item;
    }
    return items.at(-1)!;
  };
  let remainingPublicConversions = publicToOtaku;
  for (const momentum of input.momenta) {
    const committed = Math.min(remainingPublicConversions, momentum.publicToOtakuSampled);
    remainingPublicConversions -= committed;
    input.audits[momentum.auditIndex].fanFlow.publicToOtaku += committed;
    for (let index = 0; index < committed && momentum.assignInitialAffinityToNewOtaku; index += 1) {
      const memberId = choose(Object.keys(momentum.memberWeights), (id) => momentum.memberWeights[id]);
        if (memberId) {
          additionalAffinity[memberId] = (additionalAffinity[memberId] ?? 0) + 1;
          input.audits[momentum.auditIndex].fanFlow.initialAffinityByMember[memberId] = (input.audits[momentum.auditIndex].fanFlow.initialAffinityByMember[memberId] ?? 0) + 1;
        }
    }
  }
  // Event-derived external new P is created only here, after the online
  // resolver has deduplicated it against same-week SNS exposure. Attribute
  // the aggregate result back to source events for audit without inventing
  // persistent viewer identities.
  let remainingExternalPublic = input.externalExposurePublic ?? 0;
  for (const momentum of input.momenta) {
    if (remainingExternalPublic <= 0 || momentum.externalExposure <= 0) continue;
    const totalExposure = input.momenta.reduce((sum, candidate) => sum + candidate.externalExposure, 0);
    const eventShare = totalExposure > 0 ? momentum.externalExposure / totalExposure : 0;
    const attributed = Math.min(remainingExternalPublic, Math.round((input.externalExposurePublic ?? 0) * eventShare));
    remainingExternalPublic -= attributed;
    input.audits[momentum.auditIndex].fanFlow.externalToPublic += attributed;
  }
  if (remainingExternalPublic > 0) {
    const target = [...input.momenta].reverse().find((momentum) => momentum.externalExposure > 0);
    if (target) input.audits[target.auditIndex].fanFlow.externalToPublic += remainingExternalPublic;
  }
  const otakuCount = decayed.otakuCount + publicToOtaku + externalToOtaku;
  const assignedOtaku = Math.max(0, otakuCount - decayed.temporarilyUnassignedOtaku);
  const members = Object.fromEntries(Object.entries(decayed.members).map(([memberId, profile]) => {
    const newAffinity = additionalAffinity[memberId] ?? 0;
    const weekLogW = Math.max(-0.05, Math.min(0.05, logW[memberId] ?? 0));
    return [memberId, {
      affinityCount: Math.min(assignedOtaku, profile.affinityCount + newAffinity),
      purchaseWeightKJPY: profile.purchaseWeightKJPY > 0
        ? profile.purchaseWeightKJPY * Math.exp(weekLogW)
        : (newAffinity > 0 ? fanChekiBalanceV1.defaultNewAffinityW : 0),
    }];
  }));
  const fan = {
      publicCount: Math.max(0, decayed.publicCount - publicToOtaku + externalToPublic + (input.onlineNewPublic ?? 0)),
      otakuCount,
      temporarilyUnassignedOtaku: decayed.temporarilyUnassignedOtaku,
      members,
  };
  return {
    fan,
    resolution: {
      weekEnd: input.weekEnd,
      eventIds: input.momenta.map((momentum) => momentum.eventId),
      publicToOtaku,
      externalToOtaku,
      externalToPublic,
      externalExposure: input.momenta.reduce((sum, momentum) => sum + momentum.externalExposure, 0),
      onlineNewPublic: input.onlineNewPublic ?? 0,
      opening,
      closing: snapshotFan(fan),
    },
  };
}

function eventClass(kind: RuntimeEvent["kind"]) { return kind === "one-man"; }

function applyPaletteExposure(member: OperatingMember, hours: number): OperatingMember {
  const palette = Object.fromEntries((Object.keys(DEFAULT_SONG_DIRECTION) as Color8[]).map((color) => [
    color,
    Math.min(100, member.palette[color] + hours * staffAutoplayScenarioV1.performanceGrowth.memberPalettePerHour * DEFAULT_SONG_DIRECTION[color]),
  ])) as Record<Color8, number>;
  return { ...member, palette };
}

function keyPartMaximum(partType: KeyPartType): number {
  switch (partType) {
    case "opening_sabi": return 2;
    case "sabi_1_key_line": return 3;
    case "sabi_2_key_line": return 3;
    case "bridge": return 5;
    case "ochi_sabi": return 8;
    case "last_sabi": return 6;
  }
}

function teamCoreAttributeAverage(members: OperatingMember[]): number {
  const values = members.flatMap((member) => [
    member.attributes.pitch, member.attributes.tone, member.attributes.breath, member.attributes.rhythm,
    member.attributes.agility, member.attributes.power, member.attributes.stagePresence, member.attributes.stamina,
  ]);
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function staffDutyRanking(members: OperatingMember[]): string[] {
  // TUNABLE staff fallback ordering: explicit priority candidates always win;
  // this order is used only after every explicit candidate is ineligible.
  return [...members].sort((left, right) => right.attributes.stagePresence - left.attributes.stagePresence || left.id.localeCompare(right.id)).map((member) => member.id);
}

function grade(value: number, c: number) { return value >= c * 1.5 ? "A" : value >= c * 1.15 ? "B" : value >= c ? "C" : value >= c * 0.65 ? "D" : "E"; }

function finalizeMonths(state: PrologueState, eventAudits: StaffAutoplayEventAudit[], minCashByMonth: Map<string, number>, snapshots: Map<string, MonthSnapshot>): StaffAutoplayMonth[] {
  let openingCash = 3_000_000;
  const months = Array.from({ length: 20 }, (_, index) => {
    const date = new Date("2013-01-01T00:00:00Z");
    date.setUTCMonth(date.getUTCMonth() + index);
    return date.toISOString().slice(0, 7);
  });
  return months.map((month) => {
    const report = createMonthlyOperatingReport({ finance: state.finance, month, openingCash });
    openingCash = report.closingCash;
    return {
      ...report,
      publicCount: snapshots.get(month)?.publicCount ?? 0,
      otakuCount: snapshots.get(month)?.otakuCount ?? 0,
      activeRoster: snapshots.get(month)?.activeRoster ?? 0,
      eventCount: eventAudits.filter((event) => event.date.startsWith(month)).length,
      minCash: minCashByMonth.get(month) ?? report.openingCash,
    };
  });
}

/** Runs the Calendar through TIF and the mandatory following Sunday close. */
export function runStaffAutoplayPrologue(input: {
  route: StaffAutoplayRoute;
  seed: number;
  s3Variant?: StaffAutoplayS3Variant;
  /** C0 is the legacy control; C1–C3 are the v1.1 paired rollout. */
  fanAcquisitionStage?: FanAcquisitionStage;
  /** Explicit Scenario test contract; default remains disabled. */
  newcomerVoucher?: Partial<NewcomerVoucherTrialConfig>;
  /** Explicit C2/C3 fixture; no external viewer is inferred when an id is absent. */
  audienceDemand?: Partial<StaffAutoplayAudienceDemandConfig>;
}): StaffAutoplayResult {
  const s3Variant = input.s3Variant ?? "S3-C";
  const fanAcquisitionStage = input.fanAcquisitionStage ?? (input.audienceDemand?.enabled ? "C3" : "C0");
  const newcomerVoucher = { ...newcomerVoucherTrialV1, ...input.newcomerVoucher };
  const audienceDemand: StaffAutoplayAudienceDemandConfig = {
    ...staffAutoplayAudienceDemandV11,
    ...input.audienceDemand,
    externalWatchingDemandByEventId: input.audienceDemand?.externalWatchingDemandByEventId
      ?? staffAutoplayAudienceDemandV11.externalWatchingDemandByEventId,
  };
  let state = createPrologueState({ saveId: `staff-autoplay:${input.route}:${input.seed}` });
  state = signRoster(completeMandatoryInterview(state), rosterForRoute(input.route));
  state = completeStrategyAndOriginals(state);
  let operating = state.members.map(operatingMember);
  const audits: StaffAutoplayEventAudit[] = [];
  const familiaritySettlements: ({ weekEnd: string } & FamiliaritySettlement)[] = [];
  const fanWeeklyResolutions: WeeklyFanResolution[] = [];
  const onlineWeeks: WeeklyOnlineAcquisition[] = [];
  let pendingFanMomenta: PendingFanMomentum[] = [];
  const fanMonths = new Map<string, StaffAutoplayFanMonth>();
  const minCashByMonth = new Map<string, number>();
  const monthSnapshots = new Map<string, MonthSnapshot>();
  let date = state.date;
  let minCash = state.finance.cash;
  let augmented = false;
  let pendingGraduationFanTransition = false;
  let promotionSignal = 0;
  let weeklyPerformanceTotal = 0;
  let weeklyPerformanceCount = 0;

  while (date <= "2014-08-03") {
    const month = date.slice(0, 7);
    if (!fanMonths.has(month)) {
      fanMonths.set(month, {
        month,
        opening: snapshotFan(state.fan),
        closing: snapshotFan(state.fan),
        eventFlow: { otakuAttendance: 0, publicAttendance: 0, externalAudience: 0, externalExposure: 0, publicToOtaku: 0, externalToOtaku: 0, externalToPublic: 0 },
        weeklyChurn: { publicCount: 0, otakuCount: 0, affinityTotal: 0 },
      });
    }
    // Condition is a single live state.  The former long-run adapter applied
    // load but omitted every intervening day of recovery, forcing otherwise
    // healthy members to the technical floor.  This is a state-flow repair;
    // it does not alter Fan or commercial inputs.
    operating = operating.map((member) => member.active
      ? { ...member, fitnessCondition: Math.min(100, member.fitnessCondition + staffAutoplayScenarioV1.performanceGrowth.dailyConditionRecovery) }
      : member);
    // The first ordinary TIF announcement is a distinct, idempotent Brand
    // fact. It happens inside the permitted three-month window and is not an
    // artificial audience or ticket-revenue grant.
    if (date === "2014-05-02") {
      state = { ...state, reputation: applyBrandEvent({ state: state.reputation, eventId: "brand:tif-2014-08-02:announcement", gain: 126 }) };
    }
    if (date === "2014-06-27") {
      state = { ...state, reputation: applyBrandEvent({ state: state.reputation, eventId: "brand:one-man-2014-07-27:announcement", gain: 20 }) };
    }
    if (input.route === "C" && !augmented && date === "2013-10-01") {
      // Scenario-only October audition: a fresh pool, not rejected January IDs.
      state = { ...state, members: [...state.members, ...C_NEWCOMERS], fan: {
        ...state.fan, members: { ...state.fan.members, ...createFanState(C_NEWCOMERS.map((member) => member.id)).members },
      } };
      operating = state.members.map(operatingMember);
      state = post(state, { id: "scenario:c-october-costumes", date, kind: "capitalized_asset", amount: 150_000, category: "october_roster_costume", note: "Scenario C October new-pool contracts and costumes" });
      augmented = true;
    }
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday === 1) {
      state = post(state, { id: `training-room:${date}`, date, kind: "operating_cost", amount: staffAutoplayScenarioV1.normalTrainingRoomJPY, category: "training_room", note: "Staff default Medium shared training" });
      operating = operating.map((member) => member.active
        ? applyPaletteExposure({ ...member, fitnessCondition: Math.max(55, Math.min(100, member.fitnessCondition - 8 + 11)), trainingExp: member.trainingExp + staffAutoplayScenarioV1.normalTrainingHours }, staffAutoplayScenarioV1.performanceGrowth.rehearsalHoursPerSong)
        : member);
      if (s3Variant !== "S3-A") {
        const arrangementVersion = state.performanceProgression.arrangements[`${staffAutoplayScenarioV1.arrangement.songId}:${staffAutoplayScenarioV1.arrangement.graduationVersion}`]
          ? staffAutoplayScenarioV1.arrangement.graduationVersion
          : staffAutoplayScenarioV1.arrangement.initialVersion;
        state = {
          ...state,
          performanceProgression: recordArrangementExposure({
            state: state.performanceProgression,
            songId: staffAutoplayScenarioV1.arrangement.songId,
            arrangementVersion,
            sourceId: `rehearsal:${date}:${staffAutoplayScenarioV1.arrangement.songId}:${arrangementVersion}`,
            rehearsalHours: staffAutoplayScenarioV1.performanceGrowth.rehearsalHoursPerSong,
          }),
        };
      }
    }
    if (date.endsWith("-01")) {
      const payroll = state.members.filter((member) => member.active).length * staffAutoplayScenarioV1.monthlySalaryJPY;
      state = post(state, { id: `payroll:${date}`, date, kind: "operating_cost", amount: payroll, category: "member_payroll", note: "Staff default medium contracts" });
    }
    const due = state.events.filter((event) => event.date === date && event.status === "DORMANT").sort((left, right) => left.id.localeCompare(right.id));
    for (const event of due) {
      const participants = eligibleLineup(operating.filter((member) => member.active));
      const contract = contractFor(event, String(input.seed));
      const rehearsed = participants.map((member) => applyPaletteExposure(member, staffAutoplayScenarioV1.performanceGrowth.livePaletteHours));
      const arrangementVersion = state.performanceProgression.arrangements[`${staffAutoplayScenarioV1.arrangement.songId}:${staffAutoplayScenarioV1.arrangement.graduationVersion}`]
        ? staffAutoplayScenarioV1.arrangement.graduationVersion
        : staffAutoplayScenarioV1.arrangement.initialVersion;
      const arrangement = arrangementFor(state.performanceProgression, staffAutoplayScenarioV1.arrangement.songId, arrangementVersion);
      const resolvedDuties = s3Variant === "S3-C"
        ? resolveKeyDuties({
          liveId: event.id,
          songId: staffAutoplayScenarioV1.arrangement.songId,
          arrangementVersion,
          familiarityAtResolution: arrangement.familiarity,
          assignments: staffAutoplayScenarioV1.arrangement.keyAssignments,
          lineupMemberIds: rehearsed.map((member) => member.id),
          staffRankedMemberIds: staffDutyRanking(rehearsed),
        })
        : [];
      const paletteKeyParts = resolvedDuties.flatMap((duty) => {
        if (!duty.selectedMemberId) return [];
        const member = rehearsed.find((candidate) => candidate.id === duty.selectedMemberId);
        return member ? [{ maxBonus: keyPartMaximum(duty.partType), dutyPalette: member.palette, familiarity: duty.familiarityAtResolution }] : [];
      });
      const resolved = resolveOperatingPerformance(rehearsed, `${state.saveId}:${event.id}`, {}, paletteKeyParts);
      weeklyPerformanceTotal += resolved.quality;
      weeklyPerformanceCount += 1;
      if (s3Variant !== "S3-A") {
        state = {
          ...state,
          performanceProgression: recordArrangementExposure({
            state: state.performanceProgression,
            songId: staffAutoplayScenarioV1.arrangement.songId,
            arrangementVersion,
            sourceId: `live:${event.id}:${staffAutoplayScenarioV1.arrangement.songId}:${arrangementVersion}`,
            stageHours: staffAutoplayScenarioV1.performanceGrowth.livePaletteHours,
          }),
        };
      }
      operating = operating.map((member) => resolved.members.find((updated) => updated.id === member.id) ?? member);
      const fanOpening = snapshotFan(state.fan);
      const oneMan = eventClass(event.kind);
      const demandEnabled = fanAcquisitionStage === "C2" || fanAcquisitionStage === "C3" || audienceDemand.enabled;
      // The legacy opt-in diagnostic keeps its explicit-map-only behavior.
      // Scenario fixtures are used only by an explicitly selected v1.1 stage.
      const formalDemand = input.fanAcquisitionStage === "C2" || input.fanAcquisitionStage === "C3";
      const externalFixture = formalDemand ? externalDemandForEvent(event) : undefined;
      const explicitExternalDemand = audienceDemand.externalWatchingDemandByEventId[event.id];
      const awarenessRate = Math.max(0, Math.min(1,
        (audienceDemand.channelConfig?.publicAwarenessRate ?? 0.5) + (formalDemand ? promotionSignal : 0),
      ));
      const audienceAttribution = demandEnabled
        ? resolveDiagnosticAudienceChannels({
          publicCount: state.fan.publicCount,
          otakuCount: state.fan.otakuCount,
          capacity: contract.capacity,
          externalWatchingDemand: explicitExternalDemand ?? externalFixture?.watchers ?? 0,
          otakuAttendanceRate: oneMan ? fanChekiBalanceV1.pOtakuAttendBase.oneMan : fanChekiBalanceV1.pOtakuAttendBase.taiban,
          quality: resolved.quality,
          seed: `${input.seed}:${event.id}`,
          config: {
            ...audienceDemand.channelConfig,
            publicAwarenessRate: awarenessRate,
            externalIdolShare: externalFixture?.idolShare ?? audienceDemand.channelConfig?.externalIdolShare ?? 0.5,
            ...(fanAcquisitionStage === "C2" ? audienceStageV11.c2LegacyConversion : {}),
          },
        })
        : undefined;
      const actualAttendance = audienceAttribution?.actualUniqueAudience ?? contract.attendees;
      const fanOutcome = updateFanFromEvent({ fan: state.fan, participants, event, totalAudience: actualAttendance, quality: resolved.quality, exposure: resolved.memberPerformance, seed: `${input.seed}:${event.id}`, newcomerVoucher, audienceAttribution, integratedLifecycle: fanAcquisitionStage === "C3" });
      const chekiSales = Object.entries(fanOutcome.sales).flatMap(([memberId, sale]) => [
        { memberId, tierId: "1000" as const, units: sale.completedUnitsByTier["1000"] },
        { memberId, tierId: "2000" as const, units: sale.completedUnitsByTier["2000"] },
      ]).filter((sale) => sale.units > 0);
      // resolveLive owns event lifecycle, idempotency key and Cheki gross/share/cost ledger rows.
      const offered = { ...state, events: state.events.map((item) => item.id === event.id ? { ...item, status: "OFFERED" as const } : item) };
      state = resolveLive({ state: offered, eventId: event.id, participantIds: participants.map((member) => member.id), chekiSales });
      if (event.id === "debut-2013-05-24") {
        state = { ...state, reputation: applyBrandEvent({ state: state.reputation, eventId: "brand:originals:first-public-live", gain: 5 }) };
      }
      if (event.id === "tif-2014-08-02") {
        state = { ...state, reputation: applyBrandEvent({ state: state.reputation, eventId: "brand:tif-2014-08-02:completed", gain: 54 }) };
      }
      if (event.id === "one-man-2014-07-27") {
        state = { ...state, reputation: applyBrandEvent({ state: state.reputation, eventId: "brand:one-man-2014-07-27:completed", gain: 30 }) };
      }
      for (const [memberId, sale] of Object.entries(fanOutcome.sales)) {
        if (sale.freeTrialVariableCostJPY > 0) {
          state = post(state, {
            id: `${event.id}:newcomer-voucher:${memberId}`,
            date,
            kind: "operating_cost",
            amount: sale.freeTrialVariableCostJPY,
            category: "newcomer_voucher_cost",
            eventId: event.id,
            memberId,
            note: "Completed free newcomer voucher service cost",
          });
        }
      }
      const ticketRevenue = event.kind === "taiban"
        ? calculateTaibanTicketRevenue({ totalReceipts: contract.receipts, participatingGroupCount: staffAutoplayScenarioV1.taiban.groups, groupNominatedAdmissions: contract.attendees, allNominatedAdmissions: contract.attendees * staffAutoplayScenarioV1.taiban.groups })
        : event.kind === "experimental-regular" || event.kind === "regular" || event.kind === "graduation" || event.kind === "one-man" ? contract.receipts : 0;
      if (ticketRevenue > 0) state = post(state, { id: `${event.id}:ticket`, date, kind: "operating_revenue", amount: ticketRevenue, category: "ticket_revenue", eventId: event.id, note: "Scenario contract ticket settlement" });
      if (contract.venueCostJPY > 0) state = post(state, { id: `${event.id}:venue`, date, kind: "operating_cost", amount: contract.venueCostJPY, category: "venue_cost", eventId: event.id, note: "Scenario contract venue cost" });
      const lines = settleChekiSales({ event: state.events.find((item) => item.id === event.id)!, members: state.members, sales: chekiSales });
      const fanMonth = fanMonths.get(month)!;
      fanMonth.eventFlow.otakuAttendance += fanOutcome.flow.otakuAttendance;
      fanMonth.eventFlow.publicAttendance += fanOutcome.flow.publicAttendance;
      fanMonth.eventFlow.externalAudience += fanOutcome.flow.externalAudience;
      fanMonth.eventFlow.externalExposure += fanOutcome.flow.externalExposure;
      audits.push({ date, liveId: event.id, kind: event.kind, contractId: `scenario:${event.kind}`, audienceCapacity: contract.capacity, participantIds: participants.map((member) => member.id), expectedAttendance: contract.attendees, actualAttendance, performanceInternal: resolved.quality, ticketRevenueJPY: ticketRevenue, venueCostJPY: contract.venueCostJPY, chekiGrossJPY: lines.reduce((sum, line) => sum + line.grossSales, 0), chekiCommissionJPY: lines.reduce((sum, line) => sum + line.memberShare, 0), chekiVariableCostJPY: lines.reduce((sum, line) => sum + line.variableCost, 0) + Object.values(fanOutcome.sales).reduce((sum, sale) => sum + sale.freeTrialVariableCostJPY, 0), queueLostJPY: Object.values(fanOutcome.sales).reduce((sum, sale) => sum + sale.queueLostJPY, 0), publicCount: state.fan.publicCount, otakuCount: state.fan.otakuCount, affinityTotal: Object.values(state.fan.members).reduce((sum, profile) => sum + profile.affinityCount, 0), cashAfterJPY: state.finance.cash, songId: s3Variant === "S3-A" ? undefined : staffAutoplayScenarioV1.arrangement.songId, arrangementVersion: s3Variant === "S3-A" ? undefined : arrangementVersion, familiarityAtLive: s3Variant === "S3-A" ? undefined : arrangement.familiarity, paletteExecution: resolved.paletteExecution, resolvedDuties: s3Variant === "S3-C" ? resolvedDuties : undefined, cheki: { lines, queues: Object.fromEntries(Object.entries(fanOutcome.sales).map(([memberId, sale]) => [memberId, { requestedUnits: sale.requestedUnits, completedUnits: sale.completedUnits, completedUnitsByTier: { ...sale.completedUnitsByTier }, affinityVisitors: sale.affinityVisitors, buyerCount: sale.buyerCount, queueLostBuyers: sale.queueLostBuyers, queueLostJPY: sale.queueLostJPY, freeTrialRequested: sale.freeTrialRequested, freeTrialServed: sale.freeTrialServed, freeTrialLost: sale.freeTrialLost, freeTrialVariableCostJPY: sale.freeTrialVariableCostJPY }])) }, fanFlow: { opening: fanOpening, ...fanOutcome.flow }, audienceAttribution, ticketSettlementSource: "scenario-contract" });
      pendingFanMomenta.push({ eventId: event.id, auditIndex: audits.length - 1, ...fanOutcome.momentum });
      if (event.id === "graduation-2014-05-11") {
        // The completed graduation Live participates in this week's momentum;
        // apply the fan departure only after that weekly resolution.
        pendingGraduationFanTransition = true;
        if (s3Variant === "S3-C") {
          state = {
            ...state,
            performanceProgression: createArrangementVersion({
              state: state.performanceProgression,
              songId: staffAutoplayScenarioV1.arrangement.songId,
              fromArrangementVersion: staffAutoplayScenarioV1.arrangement.initialVersion,
              arrangementVersion: staffAutoplayScenarioV1.arrangement.graduationVersion,
              inheritanceFactor: staffAutoplayScenarioV1.arrangement.graduationInheritanceFactor,
            }),
          };
        }
        operating = operating.map((member) => member.id === "IPC1-001" ? { ...member, active: false } : member);
      }
    }
    if (weekEnds(date)) {
      if (s3Variant !== "S3-A") {
        const settled = settleArrangementFamiliarityWeek({
          state: state.performanceProgression,
          teamCoreAttributeAverage: teamCoreAttributeAverage(operating.filter((member) => member.active)),
          weekId: date,
        });
        state = { ...state, performanceProgression: settled.state };
        familiaritySettlements.push(...settled.settlements.map((settlement) => ({ weekEnd: date, ...settlement })));
      }
      const beforeDecay = state.fan;
      const online = fanAcquisitionStage === "C0"
        ? undefined
        : resolveWeeklyOnlineAcquisition({
          weekEnd: date,
          publicCount: beforeDecay.publicCount,
          otakuCount: beforeDecay.otakuCount,
          activeMembers: state.members.filter((member) => member.active).length,
          performanceQuality: weeklyPerformanceCount > 0 ? weeklyPerformanceTotal / weeklyPerformanceCount : 1,
          previousPromotionSignal: promotionSignal,
          externalNewUnknownReach: fanAcquisitionStage === "C3"
            ? pendingFanMomenta.reduce((sum, momentum) => sum + momentum.externalExposure, 0)
            : 0,
          seed: `${input.seed}:${input.route}`,
        });
      if (online) {
        onlineWeeks.push(online);
        promotionSignal = online.promotionSignal;
      }
      const settledFan = resolveWeeklyFanMomentum({
        fan: beforeDecay,
        momenta: pendingFanMomenta,
        audits,
        weekEnd: date,
        seed: `${input.seed}:${input.route}`,
        onlineNewPublic: online ? online.newPublic - online.externalNewPublic : undefined,
        externalExposurePublic: online?.externalNewPublic,
      });
      const afterDecay = applyWeeklyFanDecay(beforeDecay);
      const fanMonth = fanMonths.get(month)!;
      fanMonth.weeklyChurn.publicCount += beforeDecay.publicCount - afterDecay.publicCount;
      fanMonth.weeklyChurn.otakuCount += beforeDecay.otakuCount - afterDecay.otakuCount;
      fanMonth.weeklyChurn.affinityTotal += Object.values(beforeDecay.members).reduce((sum, profile) => sum + profile.affinityCount, 0) - Object.values(afterDecay.members).reduce((sum, profile) => sum + profile.affinityCount, 0);
      fanMonth.eventFlow.publicToOtaku += settledFan.resolution.publicToOtaku;
      fanMonth.eventFlow.externalToOtaku += settledFan.resolution.externalToOtaku;
      fanMonth.eventFlow.externalToPublic += settledFan.resolution.externalToPublic;
      state = { ...state, fan: settledFan.fan };
      pendingFanMomenta = [];
      if (pendingGraduationFanTransition) {
        state = graduateRina(state);
        pendingGraduationFanTransition = false;
      }
      settledFan.resolution.closing = snapshotFan(state.fan);
      fanWeeklyResolutions.push(settledFan.resolution);
      const reputationEvidence = trailingReputationEvidence(audits, date);
      state = {
        ...state,
        reputation: settleWeeklyReputation({
          state: state.reputation,
          weekEnd: date,
          debutDate: "2013-05-24",
          live: scoreLiveReputation({
            ticketGrossJPY: reputationEvidence.ticketGrossJPY,
            averageActualAttendance: reputationEvidence.averageActualAttendance,
            attributableShowCount: reputationEvidence.attributableShowCount,
          }),
          music: scoreMusicReputation({
            publishedOriginalCount: date >= "2013-05-24" ? 2 : 0,
            meanReceptionQuality: reputationEvidence.meanReceptionQuality,
          }),
        }),
      };
      weeklyPerformanceTotal = 0;
      weeklyPerformanceCount = 0;
    }
    minCash = Math.min(minCash, state.finance.cash);
    minCashByMonth.set(month, Math.min(minCashByMonth.get(month) ?? Number.POSITIVE_INFINITY, state.finance.cash));
    monthSnapshots.set(month, {
      publicCount: state.fan.publicCount,
      otakuCount: state.fan.otakuCount,
      activeRoster: state.members.filter((member) => member.active).length,
    });
    fanMonths.get(month)!.closing = snapshotFan(state.fan);
    state = { ...state, date };
    date = nextDate(date);
  }
  const performanceMean = audits.reduce((sum, event) => sum + event.performanceInternal, 0) / Math.max(1, audits.length);
  const grades = {
    fans: grade(state.fan.otakuCount, staffAutoplayScenarioV1.grades.fanC),
    performance: grade(performanceMean, staffAutoplayScenarioV1.grades.performanceC),
    business: grade(state.finance.cash, staffAutoplayScenarioV1.grades.businessC),
    overall: "E",
  };
  const ordinal = { E: 0, D: 1, C: 2, B: 3, A: 4 } as const;
  const average = (ordinal[grades.fans as keyof typeof ordinal] + ordinal[grades.performance as keyof typeof ordinal] + ordinal[grades.business as keyof typeof ordinal]) / 3;
  grades.overall = average >= 3.5 ? "A" : average >= 2.5 ? "B" : average >= 1.5 ? "C" : average >= 0.5 ? "D" : "E";
  const stageStatus: StageStatus = state.events.some((event) => event.id === "tif-2014-08-02" && event.status === "RESOLVED")
    ? (minCash < 0 ? "BANKRUPT_OR_DEBT_DISTRESS" : "COMPLETED_TIF") : "BLOCKED_BUG";
  const months = finalizeMonths(state, audits, minCashByMonth, monthSnapshots);
  const memberDevelopment = Object.fromEntries(operating.map((member) => [member.id, {
    active: member.active,
    condition: member.fitnessCondition,
    trainingHours: member.trainingExp,
    paletteMean: Object.values(member.palette).reduce((sum, value) => sum + value, 0) / 8,
    palette: member.palette,
  }]));
  return { route: input.route, seed: input.seed, runId: `staff-autoplay:${input.route}:${input.seed}`, scenarioVersion: `${staffAutoplayScenarioV1.version}:${s3Variant}`, s3Variant, tuningVersion: staffAutoplayScenarioV1.tuningVersion, fanAcquisitionStage, stageStatus, state: { ...state, monthlyReports: months }, events: audits, fanMonths: [...fanMonths.values()], fanWeeklyResolutions, onlineWeeks, familiaritySettlements, months, minCash, grades, memberDevelopment };
}
