import { chekiLedgerEntries, settleChekiSales } from "./cheki";
import { fanChekiBalanceV1, sampleFanAttendance } from "./fan";
import { calculateTaibanTicketRevenue, createFinanceState, postLedgerEntry } from "./finance";
import { emptyPalette, finalPaletteExecution, paletteMultiplier } from "./palette";
import { applyActivityLoad, liveSongGeneralLoad } from "./performance";
import { createSeededRandom, sampleBinomial } from "./random";
import { settleChekiQueue } from "./regression";
import type { DevelopedPalette, FanState, FinanceState, RuntimeEvent, RuntimeMember, SongPalette } from "./types";

type CoreAttributes = {
  agility: number; naturalFitness: number; stamina: number; pitch: number; tone: number;
  breath: number; rhythm: number; power: number; stagePresence: number;
};

type OperatingMember = RuntimeMember & { attributes: CoreAttributes; palette: DevelopedPalette; trainingExp: number };
type TicketContract = { totalReceipts: number; participatingGroupCount: number; groupNominatedAdmissions: number; allNominatedAdmissions: number | null };
type OperatingContract = { id: string; kind: "debut" | "taiban" | "free-mall"; date: string; ticket?: TicketContract; venueCostJPY: number; externalWatchingAudience: number; chekiAllowed: boolean };

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

// Core performance fields are copied from docs/data/First_Generation_Calibration_v0.6.csv.
// The complete 17-field source remains canonical; this adapter consumes only the
// fields required by the approved technical kernel.
const CORE: Record<string, CoreAttributes> = {
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
  return Object.entries(CORE).slice(0, rosterSize).map(([id, attributes], index) => ({
    id, nameJa: id, active: true, contractEndsOn: "2015-01-07", chekiCommissionRate: 0.2,
    monthlySalary: operatingSimulationV1.monthlySalaryJPY, fitnessCondition: 100,
    attributes: { ...attributes }, palette: { ...emptyPalette(0), [index === 0 ? "pink" : index === 1 ? "red" : "yellow"]: 50 }, trainingExp: 0,
  }));
}

function initialFan(members: OperatingMember[]): FanState {
  const otakuCount = 40;
  return { publicCount: 300, otakuCount, temporarilyUnassignedOtaku: 0, members: Object.fromEntries(members.map((member) => [member.id, { affinityCount: 24 / members.length, purchaseWeightKJPY: 2 }])) };
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

function performance(members: OperatingMember[], eventId: string): { quality: number; members: OperatingMember[] } {
  const random = createSeededRandom(`performance:${eventId}`);
  const pe = finalPaletteExecution({ song, participantPalettes: members.map((member) => member.palette), keyParts: [] });
  const palette = paletteMultiplier(pe);
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
    return { ...member, fitnessCondition: Math.min(100, condition + operatingSimulationV1.postLiveRecovery), _quality: total / operatingSimulationV1.songsPerLive };
  });
  const quality = Math.min(1.5, Math.max(0.5, (next.reduce((sum, member) => sum + member._quality, 0) / next.length) * palette / operatingSimulationV1.expectedImpression));
  return {
    quality,
    members: next.map((member) => {
      const { _quality: internalQuality, ...persistedMember } = member;
      void internalQuality;
      return persistedMember;
    }),
  };
}

function resolveFan(input: { fan: FanState; participantIds: string[]; contract: OperatingContract; quality: number; seed: string }) {
  const attendance = sampleFanAttendance({ fan: input.fan, kind: input.contract.kind === "debut" ? "taiban" : input.contract.kind, seed: `${input.seed}:attendance`, externalWatchingAudience: input.contract.externalWatchingAudience });
  let eligible: Record<string, number> = {};
  const sales = input.contract.chekiAllowed ? settleChekiQueue({ fan: input.fan, memberIds: input.participantIds, attendeeOtaku: attendance.otaku, seed: `${input.seed}:queue`, onAudience: (audience) => { eligible = audience.eligibleExposedOWithoutAffinity; } }) : Object.fromEntries(input.participantIds.map((id) => [id, { requestedJPY: 0, requestedUnits: 0, grossJPY: 0, completedUnits: 0, completedUnitsByTier: { "1000": 0, "2000": 0 }, variableCostJPY: 0, buyerCount: 0, affinityVisitors: 0, queueLostJPY: 0, queueLostBuyers: 0, waitMinutes: [] }])) as ReturnType<typeof settleChekiQueue>;
  const random = createSeededRandom(`${input.seed}:momentum`);
  const publicToOtaku = sampleBinomial(attendance.public, Math.min(0.2, fanChekiBalanceV1.pPublicToOtaku * input.quality), random);
  const externalToOtaku = sampleBinomial(attendance.external, Math.min(0.1, fanChekiBalanceV1.pExternalToOtaku * input.quality), random);
  const externalToPublic = sampleBinomial(attendance.external - externalToOtaku, Math.min(0.3, fanChekiBalanceV1.pExternalToPublic * input.quality), random);
  const publicCount = Math.max(0, input.fan.publicCount * (1 - fanChekiBalanceV1.pWeeklyPChurn) - publicToOtaku + externalToPublic);
  const otakuCount = Math.max(0, input.fan.otakuCount * (1 - fanChekiBalanceV1.pWeeklyOChurn) + publicToOtaku + externalToOtaku);
  const members = Object.fromEntries(Object.entries(input.fan.members).map(([id, profile]) => {
    if (!input.participantIds.includes(id)) return [id, { ...profile, affinityCount: profile.affinityCount * (1 - fanChekiBalanceV1.pWeeklyOChurn), purchaseWeightKJPY: profile.purchaseWeightKJPY }];
    const sale = sales[id];
    const exposureShare = 1 / input.participantIds.length;
    const newAffinity = (publicToOtaku + externalToOtaku) * exposureShare + sampleBinomial(eligible[id] ?? 0, Math.min(0.12, fanChekiBalanceV1.pExistingOtakuToAffinity * exposureShare * input.quality), random);
    const served = sale.buyerCount / Math.max(1, sale.affinityVisitors);
    const lost = sale.queueLostBuyers / Math.max(1, sale.affinityVisitors);
    const logW = Math.max(-0.05, Math.min(0.05, 0.015 * served * ((1 + (input.quality - 1) * operatingSimulationV1.interactionEngagementScale) - 1) - 0.01 * lost));
    return [id, { affinityCount: Math.min(otakuCount, profile.affinityCount * (1 - fanChekiBalanceV1.pWeeklyOChurn) * (1 - fanChekiBalanceV1.pWeeklyAffinityChurn) + newAffinity), purchaseWeightKJPY: profile.purchaseWeightKJPY * Math.exp(logW) }];
  }));
  return { fan: { publicCount, otakuCount, temporarilyUnassignedOtaku: 0, members }, attendance, sales };
}

export type OperatingWeekReport = { week: number; eventId: string; quality: number; attendance: number; ticketRevenueJPY: number; chekiGrossJPY: number; cash: number; publicCount: number; otakuCount: number; affinityTotal: number; meanCondition: number };

/**
 * A deterministic 12-week integration fixture. Its explicit contracts are
 * test data, not unrecorded ticket-income defaults for production events.
 */
export function runOperatingSimulation(rosterSize: 5 | 9 | 15, seed: string) {
  let members = initialMembers(rosterSize);
  let fan = initialFan(members);
  let finance: FinanceState = createFinanceState(3_000_000);
  const weeks: OperatingWeekReport[] = [];
  for (const [index, contract] of contracts.entries()) {
    const week = index + 1;
    members = train(members);
    finance = postLedgerEntry(finance, { id: `${contract.id}:training`, date: contract.date, kind: "operating_cost", amount: operatingSimulationV1.trainingRoomCostJPY, category: "training_room", note: "Staff scheduled shared medium training" });
    if (week % 4 === 0) finance = postLedgerEntry(finance, { id: `${contract.id}:payroll`, date: contract.date, kind: "operating_cost", amount: members.reduce((sum, member) => sum + (member.monthlySalary ?? 0), 0), category: "member_payroll", note: "Monthly member payroll" });
    const participants = lineup(members);
    const live = performance(participants, contract.id);
    members = members.map((member) => live.members.find((next) => next.id === member.id) ?? member);
    const outcome = resolveFan({ fan, participantIds: participants.map((member) => member.id), contract, quality: live.quality, seed: `${seed}:${contract.id}` });
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
    weeks.push({ week, eventId: contract.id, quality: live.quality, attendance: outcome.attendance.otaku + outcome.attendance.public + outcome.attendance.external, ticketRevenueJPY, chekiGrossJPY: cheki.reduce((sum, line) => sum + line.grossSales, 0), cash: finance.cash, publicCount: fan.publicCount, otakuCount: fan.otakuCount, affinityTotal: Object.values(fan.members).reduce((sum, member) => sum + member.affinityCount, 0), meanCondition: members.reduce((sum, member) => sum + member.fitnessCondition, 0) / members.length });
  }
  return { rosterSize, weeks, fan, finance, members };
}
