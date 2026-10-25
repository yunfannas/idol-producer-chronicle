import { chekiLedgerEntries, settleChekiSales } from "./cheki";
import { fanChekiBalanceV1, sampleFanAttendance } from "./fan";
import { calculateTaibanTicketRevenue, createFinanceState, postLedgerEntry } from "./finance";
import { emptyPalette, paletteExecutionBreakdown, paletteMultiplier } from "./palette";
import { applyActivityLoad, liveSongGeneralLoad } from "./performance";
import { createSeededRandom, sampleBinomial } from "./random";
import { settleChekiQueue } from "./regression";
import type { DevelopedPalette, FanState, FinanceState, RuntimeEvent, RuntimeMember, SongPalette } from "./types";

export type CoreAttributes = {
  agility: number; naturalFitness: number; stamina: number; pitch: number; tone: number;
  breath: number; rhythm: number; power: number; stagePresence: number;
};

export type OperatingMember = RuntimeMember & { attributes: CoreAttributes; palette: DevelopedPalette; trainingExp: number };
type TicketContract = { totalReceipts: number; participatingGroupCount: number; groupNominatedAdmissions: number; allNominatedAdmissions: number | null };
export type OperatingContract = { id: string; kind: "debut" | "taiban" | "free-mall" | "experimental-regular" | "regular" | "graduation" | "one-man" | "festival"; date: string; ticket?: TicketContract; venueCostJPY: number; externalWatchingAudience: number; chekiAllowed: boolean };
export type FanFixture = { publicCount: number; otakuCount: number; affinityTotal: number; purchaseWeightKJPY: number };
export type OperatingSimulationOptions = { fanFixture?: FanFixture; performanceMultiplierByMember?: Record<string, number> };
export type MemberPerformance = { impression: number; expectedImpression: number; quality: number; exposureProbability: number };

export const operatingSimulationV1 = {
  version: "operatingSimulationV1",
  trainingHoursPerWeek: 6,
  trainingRoomCostJPY: 15_000,
  monthlySalaryJPY: 10_000,
  postTrainingRecovery: 20,
  postLiveRecovery: 4.5,
  songVocalDifficulty: 12,
  songDanceDifficulty: 12,
  songsPerLive: 3,
  expectedImpression: 0.62,
  interactionEngagementScale: 0.2,
} as const;

/**
 * Fixture-only planning knobs for v3. They deliberately do not alter the
 * frozen v2 Fan/Cheki/Performance balance or claim to be chapter policy.
 */
export const operatingSimulationV3 = {
  managerCount: 1,
  managerApPerWeek: 80,
  managerBaselineApPerActiveIdol: 4,
  managerApPerLive: 4,
  coachApPerWeek: 80,
  trainingRoomJPYPerHour: 2_500,
  postTrainingRecovery: 3,
  restRecovery: 6,
  training: {
    conservative: { hours: 4, projectedConditionFloor: 65 },
    normal: { hours: 6, projectedConditionFloor: 55 },
    aggressive: { hours: 8, projectedConditionFloor: 45 },
  },
} as const;

export type StaffLineupStrategy = "performance-first" | "affinity-first" | "development-first" | "condition-song-fit";
export type TrainingIntensity = keyof typeof operatingSimulationV3.training;
export type LiveCadence = "scheduled-only" | "extra-taiban";
export type StaffWeekDecision = {
  lineupStrategy: StaffLineupStrategy;
  trainingIntensity: TrainingIntensity;
  liveCadence: LiveCadence;
};
export type StaffCandidateAssessment = {
  memberId: string;
  projectedPerformance: number;
  affinityCount: number;
  condition: number;
  songFit: number;
  trainingExp: number;
};
export type StaffWeekProposal = {
  week: number;
  eventId: string;
  suggested: StaffWeekDecision;
  candidates: StaffCandidateAssessment[];
  suggestedLineupIds: string[];
  managerApAvailable: number;
  coachApAvailable: number;
  decisionRequired: false;
};

// Core performance fields are copied from docs/data/First_Generation_Calibration_v0.6.csv.
// The complete 17-field source remains canonical; this adapter consumes only the
// fields required by the approved technical kernel.
export const prologueCoreAttributes: Record<string, CoreAttributes> = {
  "IPC1-001": { agility: 13, naturalFitness: 14, stamina: 14, pitch: 15, tone: 16, breath: 15, rhythm: 16, power: 14, stagePresence: 17 },
  "IPC1-002": { agility: 14, naturalFitness: 15, stamina: 15, pitch: 17, tone: 17, breath: 16, rhythm: 16, power: 14, stagePresence: 16 },
  "IPC1-003": { agility: 13, naturalFitness: 14, stamina: 13, pitch: 16, tone: 15, breath: 15, rhythm: 16, power: 12, stagePresence: 15 },
  "IPC1-004": { agility: 11, naturalFitness: 12, stamina: 12, pitch: 16, tone: 16, breath: 14, rhythm: 14, power: 10, stagePresence: 13 },
  "IPC1-005": { agility: 16, naturalFitness: 16, stamina: 15, pitch: 10, tone: 11, breath: 11, rhythm: 15, power: 16, stagePresence: 14 },
  "IPC1-006": { agility: 12, naturalFitness: 13, stamina: 13, pitch: 12, tone: 13, breath: 11, rhythm: 12, power: 11, stagePresence: 14 },
  "IPC1-007": { agility: 12, naturalFitness: 12, stamina: 13, pitch: 12, tone: 11, breath: 12, rhythm: 12, power: 10, stagePresence: 13 },
  "IPC1-008": { agility: 12, naturalFitness: 13, stamina: 14, pitch: 13, tone: 13, breath: 12, rhythm: 13, power: 12, stagePresence: 12 },
  "IPC1-009": { agility: 13, naturalFitness: 12, stamina: 12, pitch: 11, tone: 13, breath: 12, rhythm: 13, power: 13, stagePresence: 15 },
  "IPC1-010": { agility: 13, naturalFitness: 12, stamina: 12, pitch: 11, tone: 12, breath: 11, rhythm: 12, power: 11, stagePresence: 11 },
  "IPC1-011": { agility: 12, naturalFitness: 12, stamina: 12, pitch: 15, tone: 16, breath: 15, rhythm: 14, power: 10, stagePresence: 13 },
  "IPC1-012": { agility: 15, naturalFitness: 13, stamina: 13, pitch: 13, tone: 12, breath: 12, rhythm: 14, power: 16, stagePresence: 17 },
  "IPC1-013": { agility: 12, naturalFitness: 13, stamina: 12, pitch: 14, tone: 15, breath: 13, rhythm: 14, power: 10, stagePresence: 13 },
  "IPC1-014": { agility: 13, naturalFitness: 12, stamina: 13, pitch: 11, tone: 11, breath: 11, rhythm: 13, power: 12, stagePresence: 14 },
  "IPC1-015": { agility: 14, naturalFitness: 14, stamina: 13, pitch: 14, tone: 13, breath: 13, rhythm: 15, power: 14, stagePresence: 14 },
  "IPC1-016": { agility: 12, naturalFitness: 12, stamina: 12, pitch: 10, tone: 11, breath: 11, rhythm: 12, power: 11, stagePresence: 15 },
  "IPC1-017": { agility: 16, naturalFitness: 15, stamina: 17, pitch: 11, tone: 10, breath: 12, rhythm: 15, power: 16, stagePresence: 15 },
  "IPC1-018": { agility: 12, naturalFitness: 13, stamina: 14, pitch: 12, tone: 13, breath: 12, rhythm: 12, power: 12, stagePresence: 12 },
};

const song: SongPalette = { red: 0.25, pink: 0.1, orange: 0.1, aqua: 0.1, yellow: 0.1, green: 0.1, blue: 0.1, purple: 0.15 };
const contracts: OperatingContract[] = Array.from({ length: 12 }, (_, index) => {
  const week = index + 1;
  if (week === 1) return { id: "debut-2013-05-24", kind: "debut", date: "2013-05-24", venueCostJPY: 0, externalWatchingAudience: 60, chekiAllowed: true };
  if (week === 8) return { id: "mall-2013-09-29", kind: "free-mall", date: "2013-09-29", venueCostJPY: 0, externalWatchingAudience: 90, chekiAllowed: false };
  return {
    id: `taiban-operating-week-${week}`, kind: "taiban", date: `2013-${String(5 + Math.floor((week - 1) / 4)).padStart(2, "0")}-${String(3 + ((week - 1) % 4) * 7).padStart(2, "0")}`,
    ticket: { totalReceipts: 120_000, participatingGroupCount: 4, groupNominatedAdmissions: 8, allNominatedAdmissions: 80 },
    venueCostJPY: 8_000, externalWatchingAudience: 40, chekiAllowed: true,
  };
});

function initialMembers(rosterSize: 5 | 9 | 15): OperatingMember[] {
  return Object.entries(prologueCoreAttributes).slice(0, rosterSize).map(([id, attributes], index) => ({
    id, nameJa: id, active: true, contractEndsOn: "2015-01-07", chekiCommissionRate: 0.2,
    monthlySalary: operatingSimulationV1.monthlySalaryJPY, fitnessCondition: 100,
    attributes: { ...attributes }, palette: { ...emptyPalette(0), [index === 0 ? "pink" : index === 1 ? "red" : "yellow"]: 50 }, trainingExp: 0,
  }));
}

function initialFan(members: OperatingMember[], fixture: FanFixture): FanState {
  return { publicCount: fixture.publicCount, otakuCount: fixture.otakuCount, temporarilyUnassignedOtaku: 0, members: Object.fromEntries(members.map((member) => [member.id, { affinityCount: fixture.affinityTotal / members.length, purchaseWeightKJPY: fixture.purchaseWeightKJPY }])) };
}

function train(members: OperatingMember[]): OperatingMember[] {
  return members.map((member) => {
    const loaded = applyActivityLoad({ member, load: { general: operatingSimulationV1.trainingHoursPerWeek * 3, vocal: 0, physical: 0 }, stamina: member.attributes.stamina });
    return { ...member, ...loaded, fitnessCondition: Math.min(100, loaded.fitnessCondition + operatingSimulationV1.postTrainingRecovery), trainingExp: member.trainingExp + operatingSimulationV1.trainingHoursPerWeek };
  });
}

function lineup(members: OperatingMember[]): OperatingMember[] {
  return members.length <= 10 ? members : [...members].sort((a, b) => b.fitnessCondition - a.fitnessCondition || a.id.localeCompare(b.id)).slice(0, 10);
}

function projectedPerformance(member: OperatingMember): number {
  const conditionFactor = Math.max(0.4, member.fitnessCondition / 100);
  const breath = member.attributes.breath * conditionFactor;
  const rhythm = member.attributes.rhythm * conditionFactor;
  const power = member.attributes.power * conditionFactor;
  const expectedPitchPenalty = Math.max(0, (12 - member.attributes.pitch) * 0.07) * 0.12;
  const expectedAgilityPenalty = Math.max(0, (12 - member.attributes.agility) * 0.07) * 0.12;
  const singing = (breath + rhythm) / 40 + member.attributes.tone / 200 - expectedPitchPenalty;
  const dance = (rhythm + power) / 40 + member.attributes.power / 240 - expectedAgilityPenalty;
  return ((singing + dance) / 2) * (1 + member.attributes.stagePresence / 200);
}

function songFit(member: OperatingMember): number {
  return Object.entries(song).reduce((sum, [color, share]) => sum + share * member.palette[color as keyof SongPalette] / 100, 0);
}

function assessStaffCandidates(members: OperatingMember[], fan: FanState): StaffCandidateAssessment[] {
  return members.map((member) => ({
    memberId: member.id,
    projectedPerformance: projectedPerformance(member),
    affinityCount: fan.members[member.id]?.affinityCount ?? 0,
    condition: member.fitnessCondition,
    songFit: songFit(member),
    trainingExp: member.trainingExp,
  }));
}

function selectStaffLineup(members: OperatingMember[], fan: FanState, strategy: StaffLineupStrategy): OperatingMember[] {
  if (members.length <= 10) return members;
  const assessments = new Map(assessStaffCandidates(members, fan).map((assessment) => [assessment.memberId, assessment]));
  const score = (member: OperatingMember) => {
    const assessment = assessments.get(member.id)!;
    switch (strategy) {
      case "performance-first": return assessment.projectedPerformance;
      case "affinity-first": return assessment.affinityCount;
      case "development-first": return -assessment.trainingExp;
      case "condition-song-fit": return assessment.projectedPerformance * (0.75 + assessment.condition / 400) + assessment.songFit;
    }
  };
  return [...members].sort((left, right) => score(right) - score(left) || left.id.localeCompare(right.id)).slice(0, 10);
}

function selectTrainingTargets(members: OperatingMember[], fan: FanState, decision: StaffWeekDecision): OperatingMember[] {
  const hours = operatingSimulationV3.training[decision.trainingIntensity].hours;
  return selectStaffLineup(members, fan, decision.lineupStrategy).filter((member) => {
    const loaded = applyActivityLoad({ member, load: { general: hours * 3, vocal: 0, physical: 0 }, stamina: member.attributes.stamina });
    // Training is non-essential fixture work: honor the implementation-pack
    // protection against scheduling it when projected Condition is below 25.
    return loaded.fitnessCondition + operatingSimulationV3.postTrainingRecovery >= Math.max(25, operatingSimulationV3.training[decision.trainingIntensity].projectedConditionFloor);
  });
}

function trainWithStaffPlan(members: OperatingMember[], targetIds: Set<string>, intensity: TrainingIntensity): OperatingMember[] {
  const hours = operatingSimulationV3.training[intensity].hours;
  return members.map((member) => {
    if (!targetIds.has(member.id)) {
      return { ...member, fitnessCondition: Math.min(100, member.fitnessCondition + operatingSimulationV3.restRecovery) };
    }
    const loaded = applyActivityLoad({ member, load: { general: hours * 3, vocal: 0, physical: 0 }, stamina: member.attributes.stamina });
    return {
      ...member,
      ...loaded,
      fitnessCondition: Math.min(100, loaded.fitnessCondition + operatingSimulationV3.postTrainingRecovery),
      trainingExp: member.trainingExp + hours,
    };
  });
}

function managerApFor(decision: StaffWeekDecision): number {
  const trainingSlots = operatingSimulationV3.training[decision.trainingIntensity].hours * 2;
  const liveCount = decision.liveCadence === "extra-taiban" ? 2 : 1;
  return trainingSlots + liveCount * operatingSimulationV3.managerApPerLive;
}

export function resolveOperatingPerformance(
  members: OperatingMember[],
  eventId: string,
  multipliers: Record<string, number> = {},
  keyParts: { maxBonus: number; dutyPalette: DevelopedPalette; familiarity: number }[] = [],
): { quality: number; members: OperatingMember[]; memberPerformance: Record<string, MemberPerformance>; paletteExecution: { basePE: number; keyBonus: number; finalPE: number } } {
  const random = createSeededRandom(`performance:${eventId}`);
  const paletteExecution = paletteExecutionBreakdown({ song, participantPalettes: members.map((member) => member.palette), keyParts });
  const palette = paletteMultiplier(paletteExecution.finalPE);
  const next = members.map((member) => {
    let condition = member.fitnessCondition;
    let total = 0;
    for (let index = 0; index < operatingSimulationV1.songsPerLive; index += 1) {
      const factor = Math.max(0.4, condition / 100);
      const breath = member.attributes.breath * factor;
      const rhythm = member.attributes.rhythm * factor;
      const power = member.attributes.power * factor;
      const pitchFailure = random() < Math.max(0, (12 - member.attributes.pitch) * 0.07);
      const agilityFailure = random() < Math.max(0, (12 - member.attributes.agility) * 0.07);
      const singing = (breath + rhythm) / 40 + member.attributes.tone / 200 - (pitchFailure ? 0.12 : 0);
      const dance = (rhythm + power) / 40 + member.attributes.power / 240 - (agilityFailure ? 0.12 : 0);
      total += ((singing + dance) / 2) * (1 + member.attributes.stagePresence / 200);
      const raw = 2 + liveSongGeneralLoad(operatingSimulationV1.songVocalDifficulty, operatingSimulationV1.songDanceDifficulty);
      condition = Math.max(0, condition - raw * (14 / member.attributes.stamina));
    }
    return { ...member, fitnessCondition: Math.min(100, condition + operatingSimulationV1.postLiveRecovery), _quality: (total / operatingSimulationV1.songsPerLive) * Math.max(0, multipliers[member.id] ?? 1) };
  });
  const memberPerformance = Object.fromEntries(next.map((member) => {
    const impression = member._quality * palette;
    // This is the same Fan v1 normalization as team Q, applied to the
    // actual member Impression rather than a separate arbitrary scale.
    const quality = Math.min(1.5, Math.max(0.5, impression / operatingSimulationV1.expectedImpression));
    return [member.id, { impression, expectedImpression: operatingSimulationV1.expectedImpression, quality, exposureProbability: Math.min(1, Math.max(0, impression / operatingSimulationV1.expectedImpression)) }];
  })) as Record<string, MemberPerformance>;
  const quality = Math.min(1.5, Math.max(0.5, Object.values(memberPerformance).reduce((sum, member) => sum + member.quality, 0) / members.length));
  return {
    quality,
    memberPerformance,
    paletteExecution,
    members: next.map((member) => {
      const { _quality: internalQuality, ...persistedMember } = member;
      void internalQuality;
      return persistedMember;
    }),
  };
}

function allocateNewAffinity(total: number, participantIds: string[], memberPerformance: Record<string, MemberPerformance>, random: () => number) {
  const allocated = Object.fromEntries(participantIds.map((id) => [id, 0])) as Record<string, number>;
  const weights = participantIds.map((id) => Math.max(0, memberPerformance[id]?.impression ?? 0));
  const denominator = weights.reduce((sum, weight) => sum + weight, 0);
  for (let count = 0; count < total && denominator > 0; count += 1) {
    let remaining = random() * denominator;
    for (let index = 0; index < participantIds.length; index += 1) {
      remaining -= weights[index];
      if (remaining <= 0 || index === participantIds.length - 1) { allocated[participantIds[index]] += 1; break; }
    }
  }
  return allocated;
}

function resolveFan(input: { fan: FanState; participantIds: string[]; contract: OperatingContract; quality: number; memberPerformance: Record<string, MemberPerformance>; seed: string }) {
  const attendance = sampleFanAttendance({ fan: input.fan, kind: input.contract.kind === "debut" ? "taiban" : input.contract.kind, seed: `${input.seed}:attendance`, externalWatchingAudience: input.contract.externalWatchingAudience });
  let eligible: Record<string, number> = {};
  const sales = settleChekiQueue({ fan: input.fan, memberIds: input.participantIds, attendeeOtaku: attendance.otaku, seed: `${input.seed}:queue`, allowSales: input.contract.chekiAllowed, exposureProbabilityByMember: Object.fromEntries(input.participantIds.map((id) => [id, input.memberPerformance[id].exposureProbability])), onAudience: (audience) => { eligible = audience.eligibleExposedOWithoutAffinity; } });
  const random = createSeededRandom(`${input.seed}:momentum`);
  const publicToOtaku = sampleBinomial(attendance.public, Math.min(0.2, fanChekiBalanceV1.pPublicToOtaku * input.quality), random);
  const externalToOtaku = sampleBinomial(attendance.external, Math.min(0.1, fanChekiBalanceV1.pExternalToOtaku * input.quality), random);
  const externalToPublic = sampleBinomial(attendance.external - externalToOtaku, Math.min(0.3, fanChekiBalanceV1.pExternalToPublic * input.quality), random);
  const publicCount = Math.max(0, input.fan.publicCount * (1 - fanChekiBalanceV1.pWeeklyPChurn) - publicToOtaku + externalToPublic);
  const otakuCount = Math.max(0, input.fan.otakuCount * (1 - fanChekiBalanceV1.pWeeklyOChurn) + publicToOtaku + externalToOtaku);
  const newOtakuAffinity = allocateNewAffinity(publicToOtaku + externalToOtaku, input.participantIds, input.memberPerformance, random);
  const newAffinityByMember: Record<string, number> = {};
  const members = Object.fromEntries(Object.entries(input.fan.members).map(([id, profile]) => {
    if (!input.participantIds.includes(id)) { newAffinityByMember[id] = 0; return [id, { ...profile, affinityCount: profile.affinityCount * (1 - fanChekiBalanceV1.pWeeklyOChurn), purchaseWeightKJPY: profile.purchaseWeightKJPY }]; }
    const sale = sales[id];
    const memberQuality = input.memberPerformance[id].quality;
    const newAffinity = (newOtakuAffinity[id] ?? 0) + sampleBinomial(eligible[id] ?? 0, Math.min(1, fanChekiBalanceV1.pExistingOtakuToAffinity * memberQuality), random);
    newAffinityByMember[id] = newAffinity;
    const served = sale.buyerCount / Math.max(1, sale.affinityVisitors);
    const lost = sale.queueLostBuyers / Math.max(1, sale.affinityVisitors);
    const logW = Math.max(-0.05, Math.min(0.05, 0.015 * served * ((1 + (input.quality - 1) * operatingSimulationV1.interactionEngagementScale) - 1) - 0.01 * lost));
    return [id, { affinityCount: Math.min(otakuCount, profile.affinityCount * (1 - fanChekiBalanceV1.pWeeklyOChurn) * (1 - fanChekiBalanceV1.pWeeklyAffinityChurn) + newAffinity), purchaseWeightKJPY: profile.purchaseWeightKJPY * Math.exp(logW) }];
  }));
  return { fan: { publicCount, otakuCount, temporarilyUnassignedOtaku: 0, members }, attendance, sales, eligibleExposedOWithoutAffinity: eligible, newAffinityByMember };
}

export type OperatingWeekReport = { week: number; eventId: string; quality: number; attendance: number; ticketRevenueJPY: number; chekiGrossJPY: number; operatingRevenueJPY: number; operatingCostJPY: number; cash: number; publicCount: number; otakuCount: number; affinityTotal: number; meanCondition: number; members: Record<string, { affinityCount: number; purchaseWeightKJPY: number; impression: number; expectedImpression: number; quality: number; eligibleExposedOtaku: number; newAffinity: number; chekiRequestedJPY: number; chekiGrossJPY: number; chekiQueueLostJPY: number }> };

/**
 * A deterministic 12-week integration fixture. Its explicit contracts are
 * test data, not unrecorded ticket-income defaults for production events.
 */
export function runOperatingSimulation(rosterSize: 5 | 9 | 15, seed: string, options: OperatingSimulationOptions = {}) {
  let members = initialMembers(rosterSize);
  let fan = initialFan(members, options.fanFixture ?? { publicCount: 300, otakuCount: 40, affinityTotal: 24, purchaseWeightKJPY: 2 });
  let finance: FinanceState = createFinanceState(3_000_000);
  const weeks: OperatingWeekReport[] = [];
  for (const [index, contract] of contracts.entries()) {
    const week = index + 1;
    const entryCountAtWeekStart = finance.entries.length;
    members = train(members);
    finance = postLedgerEntry(finance, { id: `${contract.id}:training`, date: contract.date, kind: "operating_cost", amount: operatingSimulationV1.trainingRoomCostJPY, category: "training_room", note: "Staff scheduled shared medium training" });
    if (week % 4 === 0) finance = postLedgerEntry(finance, { id: `${contract.id}:payroll`, date: contract.date, kind: "operating_cost", amount: members.reduce((sum, member) => sum + (member.monthlySalary ?? 0), 0), category: "member_payroll", note: "Monthly member payroll" });
    const participants = lineup(members);
    const live = resolveOperatingPerformance(participants, contract.id, options.performanceMultiplierByMember);
    members = members.map((member) => live.members.find((next) => next.id === member.id) ?? member);
    const outcome = resolveFan({ fan, participantIds: participants.map((member) => member.id), contract, quality: live.quality, memberPerformance: live.memberPerformance, seed: `${seed}:${contract.id}` });
    fan = outcome.fan;
    const event: RuntimeEvent = { id: contract.id, date: contract.date, gate: "G05", kind: contract.kind, status: "RESOLVED", scenarioInstance: contract.id, chekiAllowed: contract.chekiAllowed, participantIds: participants.map((member) => member.id) };
    const cheki = settleChekiSales({ event, members, sales: Object.entries(outcome.sales).flatMap(([memberId, sale]) => ([
      { memberId, tierId: "1000" as const, units: sale.completedUnitsByTier["1000"] },
      { memberId, tierId: "2000" as const, units: sale.completedUnitsByTier["2000"] },
    ])) });
    for (const entry of chekiLedgerEntries({ event, date: contract.date, lines: cheki })) finance = postLedgerEntry(finance, entry);
    const ticketRevenueJPY = contract.ticket ? calculateTaibanTicketRevenue(contract.ticket) : 0;
    if (ticketRevenueJPY > 0) finance = postLedgerEntry(finance, { id: `${contract.id}:ticket`, date: contract.date, kind: "operating_revenue", amount: ticketRevenueJPY, category: "ticket_share", eventId: contract.id, note: "Explicit taiban contract settlement" });
    if (contract.venueCostJPY > 0) finance = postLedgerEntry(finance, { id: `${contract.id}:venue`, date: contract.date, kind: "operating_cost", amount: contract.venueCostJPY, category: "venue_contract", eventId: contract.id, note: "Explicit live contract cost" });
    const weekEntries = finance.entries.slice(entryCountAtWeekStart);
    const operatingRevenueJPY = weekEntries.filter((entry) => entry.kind === "operating_revenue").reduce((sum, entry) => sum + entry.amount, 0);
    const operatingCostJPY = weekEntries.filter((entry) => entry.kind === "operating_cost").reduce((sum, entry) => sum + entry.amount, 0);
    weeks.push({ week, eventId: contract.id, quality: live.quality, attendance: outcome.attendance.otaku + outcome.attendance.public + outcome.attendance.external, ticketRevenueJPY, chekiGrossJPY: cheki.reduce((sum, line) => sum + line.grossSales, 0), operatingRevenueJPY, operatingCostJPY, cash: finance.cash, publicCount: fan.publicCount, otakuCount: fan.otakuCount, affinityTotal: Object.values(fan.members).reduce((sum, member) => sum + member.affinityCount, 0), meanCondition: members.reduce((sum, member) => sum + member.fitnessCondition, 0) / members.length, members: Object.fromEntries(Object.entries(fan.members).map(([id, profile]) => [id, { affinityCount: profile.affinityCount, purchaseWeightKJPY: profile.purchaseWeightKJPY, impression: live.memberPerformance[id]?.impression ?? 0, expectedImpression: live.memberPerformance[id]?.expectedImpression ?? 0, quality: live.memberPerformance[id]?.quality ?? 0, eligibleExposedOtaku: outcome.eligibleExposedOWithoutAffinity[id] ?? 0, newAffinity: outcome.newAffinityByMember[id] ?? 0, chekiRequestedJPY: outcome.sales[id]?.requestedJPY ?? 0, chekiGrossJPY: outcome.sales[id]?.grossJPY ?? 0, chekiQueueLostJPY: outcome.sales[id]?.queueLostJPY ?? 0 }])) });
  }
  return { rosterSize, weeks, fan, finance, members };
}

type OperatingV3MemberReport = {
  affinityCount: number;
  purchaseWeightKJPY: number;
  liveAppearances: number;
  impression: number;
  expectedImpression: number;
  newAffinity: number;
  chekiRequestedJPY: number;
  chekiGrossJPY: number;
  chekiQueueLostJPY: number;
  trainingExp: number;
  condition: number;
};

export type OperatingV3WeekReport = {
  week: number;
  eventIds: string[];
  staffDecision: StaffWeekDecision;
  lineupByEvent: Record<string, string[]>;
  participantIds: string[];
  trainingTargetIds: string[];
  managerApUsed: number;
  managerApAvailable: number;
  coachApUsed: number;
  coachApAvailable: number;
  attendance: number;
  quality: number;
  operatingRevenueJPY: number;
  operatingCostJPY: number;
  cash: number;
  publicCount: number;
  otakuCount: number;
  affinityTotal: number;
  meanCondition: number;
  members: Record<string, OperatingV3MemberReport>;
};

export type OperatingSimulationV3Result = {
  rosterSize: 5 | 9 | 15;
  weeks: OperatingV3WeekReport[];
  fan: FanState;
  finance: FinanceState;
  members: OperatingMember[];
};

export type OperatingSimulationV3Session = {
  proposeWeek: () => StaffWeekProposal | null;
  confirmWeek: (decision?: Partial<StaffWeekDecision>) => OperatingV3WeekReport;
  result: () => OperatingSimulationV3Result;
};

type V3MutableState = {
  members: OperatingMember[];
  fan: FanState;
  finance: FinanceState;
  week: number;
  reports: OperatingV3WeekReport[];
};

const DEFAULT_STAFF_DECISION: StaffWeekDecision = {
  lineupStrategy: "condition-song-fit",
  trainingIntensity: "normal",
  liveCadence: "scheduled-only",
};

function extraTaibanContract(base: OperatingContract, week: number): OperatingContract {
  return {
    id: `staff-extra-taiban-week-${week}`,
    kind: "taiban",
    date: base.date,
    // This is an explicit v3 fixture contract: no invented ticket income.
    ticket: { totalReceipts: 80_000, participatingGroupCount: 4, groupNominatedAdmissions: 6, allNominatedAdmissions: 60 },
    venueCostJPY: 4_000,
    externalWatchingAudience: 20,
    chekiAllowed: true,
  };
}

function suggestedStaffDecision(members: OperatingMember[], fan: FanState): StaffWeekDecision {
  const lowestCondition = Math.min(...members.map((member) => member.fitnessCondition));
  const needsDevelopment = Math.max(...members.map((member) => member.trainingExp)) - Math.min(...members.map((member) => member.trainingExp)) >= 12;
  if (lowestCondition < 55) return { ...DEFAULT_STAFF_DECISION, trainingIntensity: "conservative" };
  if (needsDevelopment) return { ...DEFAULT_STAFF_DECISION, lineupStrategy: "development-first" };
  const totalAffinity = Object.values(fan.members).reduce((sum, profile) => sum + profile.affinityCount, 0);
  return totalAffinity >= 45 ? { ...DEFAULT_STAFF_DECISION, lineupStrategy: "affinity-first" } : DEFAULT_STAFF_DECISION;
}

function buildStaffProposal(state: V3MutableState): StaffWeekProposal | null {
  const contract = contracts[state.week];
  if (!contract) return null;
  const suggested = suggestedStaffDecision(state.members, state.fan);
  const managerApAvailable = operatingSimulationV3.managerApPerWeek * operatingSimulationV3.managerCount - operatingSimulationV3.managerBaselineApPerActiveIdol * state.members.length;
  const suggestedLineupIds = selectStaffLineup(state.members, state.fan, suggested.lineupStrategy).map((member) => member.id);
  return {
    week: state.week + 1,
    eventId: contract.id,
    suggested,
    candidates: assessStaffCandidates(state.members, state.fan),
    suggestedLineupIds,
    managerApAvailable,
    coachApAvailable: operatingSimulationV3.coachApPerWeek,
    // Routine work remains automatic in Chronicle. This is a preview/override
    // seam for authorized workflow decisions, not a mandatory weekly meeting.
    decisionRequired: false,
  };
}

function settleV3Live(input: {
  state: V3MutableState;
  contract: OperatingContract;
  participantIds: string[];
  seed: string;
}) {
  const participants = input.state.members.filter((member) => input.participantIds.includes(member.id));
    const live = resolveOperatingPerformance(participants, input.contract.id);
  const members = input.state.members.map((member) => live.members.find((next) => next.id === member.id) ?? member);
  const outcome = resolveFan({ fan: input.state.fan, participantIds: input.participantIds, contract: input.contract, quality: live.quality, memberPerformance: live.memberPerformance, seed: `${input.seed}:${input.contract.id}` });
  const event: RuntimeEvent = { id: input.contract.id, date: input.contract.date, gate: "G05", kind: input.contract.kind, status: "RESOLVED", scenarioInstance: input.contract.id, chekiAllowed: input.contract.chekiAllowed, participantIds: input.participantIds };
  const cheki = settleChekiSales({ event, members, sales: Object.entries(outcome.sales).flatMap(([memberId, sale]) => ([
    { memberId, tierId: "1000" as const, units: sale.completedUnitsByTier["1000"] },
    { memberId, tierId: "2000" as const, units: sale.completedUnitsByTier["2000"] },
  ])) });
  let finance = input.state.finance;
  for (const entry of chekiLedgerEntries({ event, date: input.contract.date, lines: cheki })) finance = postLedgerEntry(finance, entry);
  const ticketRevenueJPY = input.contract.ticket ? calculateTaibanTicketRevenue(input.contract.ticket) : 0;
  if (ticketRevenueJPY > 0) finance = postLedgerEntry(finance, { id: `${input.contract.id}:ticket`, date: input.contract.date, kind: "operating_revenue", amount: ticketRevenueJPY, category: "ticket_share", eventId: input.contract.id, note: "Explicit v3 fixture contract settlement" });
  if (input.contract.venueCostJPY > 0) finance = postLedgerEntry(finance, { id: `${input.contract.id}:venue`, date: input.contract.date, kind: "operating_cost", amount: input.contract.venueCostJPY, category: "venue_contract", eventId: input.contract.id, note: "Explicit v3 fixture contract cost" });
  return { members, fan: outcome.fan, finance, attendance: outcome.attendance.otaku + outcome.attendance.public + outcome.attendance.external, quality: live.quality, memberPerformance: live.memberPerformance, sales: outcome.sales, newAffinityByMember: outcome.newAffinityByMember };
}

/**
 * In-memory weekly gameplay seam. It intentionally is not `PrologueState`, a
 * save format, or Calendar UI integration; those must consume this proven
 * decision/result contract in a later migration.
 */
export function createOperatingSimulationV3Session(rosterSize: 5 | 9 | 15, seed: string, options: Pick<OperatingSimulationOptions, "fanFixture"> = {}): OperatingSimulationV3Session {
  const fixture = options.fanFixture ?? { publicCount: 300, otakuCount: 40, affinityTotal: 24, purchaseWeightKJPY: 2 };
  const initial = initialMembers(rosterSize);
  const state: V3MutableState = {
    members: initial,
    fan: initialFan(initial, fixture),
    finance: createFinanceState(3_000_000),
    week: 0,
    reports: [],
  };

  return {
    proposeWeek: () => buildStaffProposal(state),
    confirmWeek: (override = {}) => {
      const proposal = buildStaffProposal(state);
      if (!proposal) throw new Error("Operating Simulation v3 is already complete");
      const decision: StaffWeekDecision = { ...proposal.suggested, ...override };
      const managerApUsed = managerApFor(decision);
      const coachApUsed = operatingSimulationV3.training[decision.trainingIntensity].hours * 2;
      if (managerApUsed > proposal.managerApAvailable || coachApUsed > proposal.coachApAvailable) {
        throw new Error("Staff AP conflict requires a different weekly plan");
      }
      const trainingTargets = selectTrainingTargets(state.members, state.fan, decision);
      state.members = trainWithStaffPlan(state.members, new Set(trainingTargets.map((member) => member.id)), decision.trainingIntensity);
      const baseContract = contracts[state.week];
      const entryCountAtWeekStart = state.finance.entries.length;
      const trainingCost = operatingSimulationV3.training[decision.trainingIntensity].hours * operatingSimulationV3.trainingRoomJPYPerHour;
      state.finance = postLedgerEntry(state.finance, { id: `${baseContract.id}:staff-training`, date: baseContract.date, kind: "operating_cost", amount: trainingCost, category: "training_room", note: `Staff ${decision.trainingIntensity} shared training proposal` });
      if ((state.week + 1) % 4 === 0) {
        state.finance = postLedgerEntry(state.finance, { id: `${baseContract.id}:payroll`, date: baseContract.date, kind: "operating_cost", amount: state.members.reduce((sum, member) => sum + (member.monthlySalary ?? 0), 0), category: "member_payroll", note: "Monthly member payroll" });
      }
      const contractsThisWeek = [baseContract, ...(decision.liveCadence === "extra-taiban" ? [extraTaibanContract(baseContract, state.week + 1)] : [])];
      const appearances = Object.fromEntries(state.members.map((member) => [member.id, { count: 0, impression: 0, expected: 0, newAffinity: 0, requested: 0, gross: 0, lost: 0 }])) as Record<string, { count: number; impression: number; expected: number; newAffinity: number; requested: number; gross: number; lost: number }>;
      let attendance = 0;
      let quality = 0;
      let participantIds: string[] = [];
      const lineupByEvent: Record<string, string[]> = {};
      for (const contract of contractsThisWeek) {
        const participants = selectStaffLineup(state.members, state.fan, decision.lineupStrategy);
        participantIds = participants.map((member) => member.id);
        lineupByEvent[contract.id] = participantIds;
        const resolved = settleV3Live({ state, contract, participantIds, seed });
        state.members = resolved.members;
        state.fan = resolved.fan;
        state.finance = resolved.finance;
        attendance += resolved.attendance;
        quality += resolved.quality;
        for (const member of state.members) {
          const performance = resolved.memberPerformance[member.id];
          const sales = resolved.sales[member.id];
          if (performance) {
            appearances[member.id].count += 1;
            appearances[member.id].impression += performance.impression;
            appearances[member.id].expected += performance.expectedImpression;
          }
          appearances[member.id].newAffinity += resolved.newAffinityByMember[member.id] ?? 0;
          appearances[member.id].requested += sales?.requestedJPY ?? 0;
          appearances[member.id].gross += sales?.grossJPY ?? 0;
          appearances[member.id].lost += sales?.queueLostJPY ?? 0;
        }
      }
      const weekEntries = state.finance.entries.slice(entryCountAtWeekStart);
      const operatingRevenueJPY = weekEntries.filter((entry) => entry.kind === "operating_revenue").reduce((sum, entry) => sum + entry.amount, 0);
      const operatingCostJPY = weekEntries.filter((entry) => entry.kind === "operating_cost").reduce((sum, entry) => sum + entry.amount, 0);
      const report: OperatingV3WeekReport = {
        week: state.week + 1,
        eventIds: contractsThisWeek.map((contract) => contract.id),
        staffDecision: decision,
        lineupByEvent,
        participantIds,
        trainingTargetIds: trainingTargets.map((member) => member.id),
        managerApUsed,
        managerApAvailable: proposal.managerApAvailable,
        coachApUsed,
        coachApAvailable: proposal.coachApAvailable,
        attendance,
        quality: quality / contractsThisWeek.length,
        operatingRevenueJPY,
        operatingCostJPY,
        cash: state.finance.cash,
        publicCount: state.fan.publicCount,
        otakuCount: state.fan.otakuCount,
        affinityTotal: Object.values(state.fan.members).reduce((sum, member) => sum + member.affinityCount, 0),
        meanCondition: state.members.reduce((sum, member) => sum + member.fitnessCondition, 0) / state.members.length,
        members: Object.fromEntries(state.members.map((member) => {
          const metrics = appearances[member.id];
          const profile = state.fan.members[member.id];
          return [member.id, {
            affinityCount: profile.affinityCount,
            purchaseWeightKJPY: profile.purchaseWeightKJPY,
            liveAppearances: metrics.count,
            impression: metrics.count > 0 ? metrics.impression / metrics.count : 0,
            expectedImpression: metrics.count > 0 ? metrics.expected / metrics.count : 0,
            newAffinity: metrics.newAffinity,
            chekiRequestedJPY: metrics.requested,
            chekiGrossJPY: metrics.gross,
            chekiQueueLostJPY: metrics.lost,
            trainingExp: member.trainingExp,
            condition: member.fitnessCondition,
          }];
        })),
      };
      state.reports.push(report);
      state.week += 1;
      return report;
    },
    result: () => ({ rosterSize, weeks: [...state.reports], fan: state.fan, finance: state.finance, members: state.members }),
  };
}

export function runOperatingSimulationV3(input: {
  rosterSize: 5 | 9 | 15;
  seed: string;
  fanFixture?: FanFixture;
  decide?: (proposal: StaffWeekProposal) => Partial<StaffWeekDecision>;
}): OperatingSimulationV3Result {
  const session = createOperatingSimulationV3Session(input.rosterSize, input.seed, { fanFixture: input.fanFixture });
  for (let proposal = session.proposeWeek(); proposal; proposal = session.proposeWeek()) {
    session.confirmWeek(input.decide?.(proposal));
  }
  return session.result();
}
