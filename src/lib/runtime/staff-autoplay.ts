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
import { applyWeeklyFanDecay, createFanState } from "./fan";
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
import type { Color8, FanState, PrologueState, RuntimeEvent, RuntimeMember } from "./types";

export type StaffAutoplayRoute = "A" | "B" | "C";
export type StageStatus = "COMPLETED_TIF" | "BANKRUPT_OR_DEBT_DISTRESS" | "BLOCKED_BUG";

export const staffAutoplayScenarioV1 = {
  version: "staff-autoplay-scenario-v3-performance-recovery",
  tuningVersion: "fanChekiBalanceV1",
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
} as const;

const DEFAULT_SONG_DIRECTION: Record<Color8, number> = {
  red: 0.25, pink: 0.1, orange: 0.1, aqua: 0.1, yellow: 0.1, green: 0.1, blue: 0.1, purple: 0.15,
};

type EventAudit = {
  date: string;
  liveId: string;
  kind: RuntimeEvent["kind"];
  contractId: string;
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
  fanFlow: { otakuAttendance: number; publicAttendance: number; externalAudience: number; publicToOtaku: number; externalToOtaku: number; externalToPublic: number };
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
  tuningVersion: string;
  stageStatus: StageStatus;
  state: PrologueState;
  events: EventAudit[];
  months: StaffAutoplayMonth[];
  minCash: number;
  grades: { fans: string; performance: string; business: string; overall: string };
  memberDevelopment: Record<string, { trainingHours: number; paletteMean: number; palette: Record<Color8, number> }>;
};

type MonthSnapshot = { publicCount: number; otakuCount: number; activeRoster: number };

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
    return { attendees, receipts: attendees * input.ticketJPY, venueCostJPY: input.venueCostJPY };
  };
  if (event.kind === "debut") return { attendees: sampled({ capacity: 1_000, sellThrough: 0.08, ticketJPY: 0, venueCostJPY: 0 }).attendees, receipts: 0, venueCostJPY: 0 };
  if (event.kind === "free-mall") return { attendees: sampled({ capacity: 180, sellThrough: 0.45, ticketJPY: 0, venueCostJPY: 0 }).attendees, receipts: 0, venueCostJPY: 0 };
  if (event.kind === "experimental-regular") return sampled(staffAutoplayScenarioV1.experimentalRegular);
  if (event.kind === "regular") return sampled(staffAutoplayScenarioV1.regular);
  if (event.kind === "graduation") return sampled(staffAutoplayScenarioV1.graduation);
  if (event.kind === "one-man") return sampled(staffAutoplayScenarioV1.oneMan);
  if (event.kind === "festival") return sampled(staffAutoplayScenarioV1.festival);
  return sampled(staffAutoplayScenarioV1.taiban);
}

function updateFanFromEvent(input: {
  fan: FanState; participants: OperatingMember[]; event: RuntimeEvent; actualExternal: number;
  quality: number; exposure: Record<string, { exposureProbability: number; quality: number }>; seed: string;
}) {
  // Reuse the executable Fan/Cheki queue via its event-local reconstruction.
  // The small aggregate conversion below is deliberately the v1 P/O/A/W
  // shape; it does not fabricate a Core cohort or a roster-size multiplier.
  const attendance = Math.min(Math.round(input.fan.otakuCount), Math.round(input.fan.otakuCount * (eventClass(input.event.kind) ? 0.32 : 0.12)));
  let eligible: Record<string, number> = {};
  const sales = settleChekiQueue({
    fan: input.fan, memberIds: input.participants.map((member) => member.id), attendeeOtaku: attendance,
    seed: `${input.seed}:queue`, allowSales: input.event.chekiAllowed,
    exposureProbabilityByMember: Object.fromEntries(input.participants.map((member) => [member.id, input.exposure[member.id]?.exposureProbability ?? 0])),
    onAudience: (audience) => { eligible = audience.eligibleExposedOWithoutAffinity; },
  });
  const random = createSeededRandom(`${input.seed}:fan`);
  const q = Math.max(0.5, Math.min(1.5, input.quality));
  const publicAttend = sampleBinomial(input.fan.publicCount, eventClass(input.event.kind) ? 0.07 : 0.012, random);
  const publicToO = sampleBinomial(publicAttend, Math.min(0.2, 0.025 * q), random);
  const externalToO = sampleBinomial(input.actualExternal, Math.min(0.1, 0.004 * q), random);
  const externalToP = sampleBinomial(input.actualExternal - externalToO, Math.min(0.3, 0.08 * q), random);
  const nextO = Math.max(0, input.fan.otakuCount + publicToO + externalToO);
  const weights = input.participants.map((member) => Math.max(0, input.exposure[member.id]?.quality ?? 0));
  const denominator = weights.reduce((total, value) => total + value, 0);
  const newByMember = Object.fromEntries(input.participants.map((member) => [member.id, 0])) as Record<string, number>;
  for (let index = 0; index < publicToO + externalToO; index += 1) {
    let point = random() * denominator;
    for (let position = 0; position < input.participants.length; position += 1) {
      point -= weights[position];
      if (point <= 0 || position === input.participants.length - 1) { newByMember[input.participants[position].id] += 1; break; }
    }
  }
  const members = Object.fromEntries(Object.entries(input.fan.members).map(([id, profile]) => {
    if (!input.participants.some((member) => member.id === id)) return [id, profile];
    const queue = sales[id];
    const share = denominator > 0 ? Math.max(0, input.exposure[id]?.quality ?? 0) / denominator : 0;
    const newAffinity = (newByMember[id] ?? 0) + sampleBinomial(eligible[id] ?? 0, Math.min(0.12, 0.10 * share * (input.exposure[id]?.quality ?? 1)), random);
    const served = queue.buyerCount / Math.max(1, queue.affinityVisitors);
    const lost = queue.queueLostBuyers / Math.max(1, queue.affinityVisitors);
    const logW = Math.max(-0.05, Math.min(0.05, 0.015 * served * (q - 1) - 0.01 * lost));
    return [id, {
      affinityCount: Math.min(nextO, profile.affinityCount + newAffinity),
      purchaseWeightKJPY: profile.purchaseWeightKJPY > 0 ? profile.purchaseWeightKJPY * Math.exp(logW) : (newAffinity > 0 ? 1.8 : 0),
    }];
  }));
  return { fan: { publicCount: Math.max(0, input.fan.publicCount - publicToO + externalToP), otakuCount: nextO, temporarilyUnassignedOtaku: input.fan.temporarilyUnassignedOtaku, members }, sales, flow: { otakuAttendance: attendance, publicAttendance: publicAttend, externalAudience: input.actualExternal, publicToOtaku: publicToO, externalToOtaku: externalToO, externalToPublic: externalToP } };
}

function eventClass(kind: RuntimeEvent["kind"]) { return kind === "one-man"; }

function applyPaletteExposure(member: OperatingMember, hours: number): OperatingMember {
  const palette = Object.fromEntries((Object.keys(DEFAULT_SONG_DIRECTION) as Color8[]).map((color) => [
    color,
    Math.min(100, member.palette[color] + hours * staffAutoplayScenarioV1.performanceGrowth.memberPalettePerHour * DEFAULT_SONG_DIRECTION[color]),
  ])) as Record<Color8, number>;
  return { ...member, palette };
}

function grade(value: number, c: number) { return value >= c * 1.5 ? "A" : value >= c * 1.15 ? "B" : value >= c ? "C" : value >= c * 0.65 ? "D" : "E"; }

function finalizeMonths(state: PrologueState, eventAudits: EventAudit[], minCashByMonth: Map<string, number>, snapshots: Map<string, MonthSnapshot>): StaffAutoplayMonth[] {
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

/** Runs the Calendar from the mandatory interview through the real TIF event. */
export function runStaffAutoplayPrologue(input: { route: StaffAutoplayRoute; seed: number }): StaffAutoplayResult {
  let state = createPrologueState({ saveId: `staff-autoplay:${input.route}:${input.seed}` });
  state = signRoster(completeMandatoryInterview(state), rosterForRoute(input.route));
  state = completeStrategyAndOriginals(state);
  let operating = state.members.map(operatingMember);
  const audits: EventAudit[] = [];
  const minCashByMonth = new Map<string, number>();
  const monthSnapshots = new Map<string, MonthSnapshot>();
  let date = state.date;
  let minCash = state.finance.cash;
  let augmented = false;

  while (date <= "2014-08-02") {
    // Condition is a single live state.  The former long-run adapter applied
    // load but omitted every intervening day of recovery, forcing otherwise
    // healthy members to the technical floor.  This is a state-flow repair;
    // it does not alter Fan or commercial inputs.
    operating = operating.map((member) => ({ ...member, fitnessCondition: Math.min(100, member.fitnessCondition + staffAutoplayScenarioV1.performanceGrowth.dailyConditionRecovery) }));
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
      operating = operating.map((member) => applyPaletteExposure({ ...member, fitnessCondition: Math.max(55, Math.min(100, member.fitnessCondition - 8 + 11)), trainingExp: member.trainingExp + staffAutoplayScenarioV1.normalTrainingHours }, staffAutoplayScenarioV1.performanceGrowth.rehearsalHoursPerSong));
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
      const resolved = resolveOperatingPerformance(rehearsed, `${state.saveId}:${event.id}`);
      operating = operating.map((member) => resolved.members.find((updated) => updated.id === member.id) ?? member);
      const fanOutcome = updateFanFromEvent({ fan: state.fan, participants, event, actualExternal: contract.attendees, quality: resolved.quality, exposure: resolved.memberPerformance, seed: `${input.seed}:${event.id}` });
      const chekiSales = Object.entries(fanOutcome.sales).flatMap(([memberId, sale]) => [
        { memberId, tierId: "1000" as const, units: sale.completedUnitsByTier["1000"] },
        { memberId, tierId: "2000" as const, units: sale.completedUnitsByTier["2000"] },
      ]).filter((sale) => sale.units > 0);
      state = { ...state, fan: fanOutcome.fan };
      // resolveLive owns event lifecycle, idempotency key and Cheki gross/share/cost ledger rows.
      const offered = { ...state, events: state.events.map((item) => item.id === event.id ? { ...item, status: "OFFERED" as const } : item) };
      state = resolveLive({ state: offered, eventId: event.id, participantIds: participants.map((member) => member.id), chekiSales });
      const ticketRevenue = event.kind === "taiban"
        ? calculateTaibanTicketRevenue({ totalReceipts: contract.receipts, participatingGroupCount: staffAutoplayScenarioV1.taiban.groups, groupNominatedAdmissions: contract.attendees, allNominatedAdmissions: contract.attendees * staffAutoplayScenarioV1.taiban.groups })
        : event.kind === "experimental-regular" || event.kind === "regular" || event.kind === "graduation" || event.kind === "one-man" ? contract.receipts : 0;
      if (ticketRevenue > 0) state = post(state, { id: `${event.id}:ticket`, date, kind: "operating_revenue", amount: ticketRevenue, category: "ticket_revenue", eventId: event.id, note: "Scenario contract ticket settlement" });
      if (contract.venueCostJPY > 0) state = post(state, { id: `${event.id}:venue`, date, kind: "operating_cost", amount: contract.venueCostJPY, category: "venue_cost", eventId: event.id, note: "Scenario contract venue cost" });
      const lines = settleChekiSales({ event: state.events.find((item) => item.id === event.id)!, members: state.members, sales: chekiSales });
      audits.push({ date, liveId: event.id, kind: event.kind, contractId: `scenario:${event.kind}`, participantIds: participants.map((member) => member.id), expectedAttendance: contract.attendees, actualAttendance: contract.attendees, performanceInternal: resolved.quality, ticketRevenueJPY: ticketRevenue, venueCostJPY: contract.venueCostJPY, chekiGrossJPY: lines.reduce((sum, line) => sum + line.grossSales, 0), chekiCommissionJPY: lines.reduce((sum, line) => sum + line.memberShare, 0), chekiVariableCostJPY: lines.reduce((sum, line) => sum + line.variableCost, 0), queueLostJPY: Object.values(fanOutcome.sales).reduce((sum, sale) => sum + sale.queueLostJPY, 0), publicCount: state.fan.publicCount, otakuCount: state.fan.otakuCount, affinityTotal: Object.values(state.fan.members).reduce((sum, profile) => sum + profile.affinityCount, 0), cashAfterJPY: state.finance.cash, fanFlow: fanOutcome.flow });
      if (event.id === "graduation-2014-05-11") {
        state = graduateRina(state);
        operating = operating.map((member) => member.id === "IPC1-001" ? { ...member, active: false } : member);
      }
    }
    if (weekEnds(date)) state = { ...state, fan: applyWeeklyFanDecay(state.fan) };
    minCash = Math.min(minCash, state.finance.cash);
    const month = date.slice(0, 7);
    minCashByMonth.set(month, Math.min(minCashByMonth.get(month) ?? Number.POSITIVE_INFINITY, state.finance.cash));
    monthSnapshots.set(month, {
      publicCount: state.fan.publicCount,
      otakuCount: state.fan.otakuCount,
      activeRoster: state.members.filter((member) => member.active).length,
    });
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
    trainingHours: member.trainingExp,
    paletteMean: Object.values(member.palette).reduce((sum, value) => sum + value, 0) / 8,
    palette: member.palette,
  }]));
  return { route: input.route, seed: input.seed, runId: `staff-autoplay:${input.route}:${input.seed}`, scenarioVersion: staffAutoplayScenarioV1.version, tuningVersion: staffAutoplayScenarioV1.tuningVersion, stageStatus, state: { ...state, monthlyReports: months }, events: audits, months, minCash, grades, memberDevelopment };
}
