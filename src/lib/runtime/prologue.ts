import { chekiLedgerEntries, settleChekiSales } from "./cheki";
import { createFanState } from "./fan";
import { createFinanceState, postLedgerEntry } from "./finance";
import type {
  ChekiSaleInput,
  Difficulty,
  ParentRuntimePorts,
  PrologueGate,
  PrologueState,
  RuntimeEvent,
  RuntimeMember,
} from "./types";

const FOUNDER_IDS = ["IPC1-001", "IPC1-002", "IPC1-003"] as const;

const CANDIDATES = [
  ["IPC1-004", "水瀬紗月"], ["IPC1-005", "瀬戸夏帆"], ["IPC1-006", "藤咲美緒"],
  ["IPC1-007", "朝倉七海"], ["IPC1-008", "白石凛花"], ["IPC1-009", "桐谷玲音"],
  ["IPC1-010", "相沢芽衣"], ["IPC1-011", "篠原奏"], ["IPC1-012", "西園寺茉莉"],
  ["IPC1-013", "高瀬千紘"], ["IPC1-014", "北川莉緒"], ["IPC1-015", "花房詩乃"],
  ["IPC1-016", "成瀬瑠菜"], ["IPC1-017", "早瀬美波"], ["IPC1-018", "森川由依"],
] as const;

const founders: RuntimeMember[] = [
  ["IPC1-001", "星野莉奈"], ["IPC1-002", "宮原優花"], ["IPC1-003", "小日向陽菜"],
].map(([id, nameJa]) => ({
  id,
  nameJa,
  active: true,
  contractEndsOn: "2015-01-07",
  chekiCommissionRate: 0.2,
  fitnessCondition: 100,
  developedPalette: Object.fromEntries(
    (["red", "pink", "orange", "aqua", "yellow", "green", "blue", "purple"] as const).map((color) => [
      color,
      id === "IPC1-001" && color === "pink" ? 10 : id === "IPC1-002" && color === "red" ? 5 : id === "IPC1-003" && color === "yellow" ? 5 : 0,
    ]),
  ) as RuntimeMember["developedPalette"],
}));

function emptyGates(): Record<PrologueGate, boolean> {
  return Object.fromEntries(
    Array.from({ length: 13 }, (_, index) => [`G${String(index).padStart(2, "0")}`, false]),
  ) as Record<PrologueGate, boolean>;
}

function event(
  id: string,
  date: string,
  gate: PrologueGate,
  kind: RuntimeEvent["kind"],
  chekiAllowed: boolean,
): RuntimeEvent {
  return { id, date, gate, kind, status: "DORMANT", scenarioInstance: id, chekiAllowed, participantIds: [] };
}

function regularWednesdayEvents(): RuntimeEvent[] {
  const events: RuntimeEvent[] = [];
  const end = new Date("2014-08-02T00:00:00Z");
  for (let current = new Date("2014-03-05T00:00:00Z"); current <= end; current.setUTCDate(current.getUTCDate() + 7)) {
    const date = current.toISOString().slice(0, 10);
    // The 4/16 announcement happens in that week's one regular live, rather
    // than creating a second live with the same date.
    if (date === "2014-04-16") continue;
    events.push(event(`regular-${date}`, date, "G08", "regular", true));
  }
  return events;
}

/** Fixed prologue table plus every Wednesday from 2014-03-05; each record has one live_id. */
export function createPrologueSchedule(): RuntimeEvent[] {
  return [
    event("debut-2013-05-24", "2013-05-24", "G05", "debut", true),
    event("taiban-2013-06-18", "2013-06-18", "G05", "taiban", true),
    event("taiban-2013-06-29", "2013-06-29", "G05", "taiban", true),
    event("taiban-2013-07-30", "2013-07-30", "G05", "taiban", true),
    event("taiban-2013-09-18", "2013-09-18", "G05", "taiban", true),
    event("taiban-2013-09-25", "2013-09-25", "G05", "taiban", true),
    event("mall-2013-09-29", "2013-09-29", "G06", "free-mall", false),
    event("taiban-2013-10-05", "2013-10-05", "G06", "taiban", true),
    event("taiban-2013-10-19", "2013-10-19", "G06", "taiban", true),
    event("taiban-2013-11-03", "2013-11-03", "G06", "taiban", true),
    event("taiban-2013-12-01", "2013-12-01", "G06", "taiban", true),
    event("taiban-2013-12-25", "2013-12-25", "G06", "taiban", true),
    event("experimental-2014-01-15", "2014-01-15", "G07", "experimental-regular", true),
    event("experimental-2014-01-29", "2014-01-29", "G07", "experimental-regular", true),
    event("experimental-2014-02-12", "2014-02-12", "G07", "experimental-regular", true),
    event("experimental-2014-02-26", "2014-02-26", "G07", "experimental-regular", true),
    ...regularWednesdayEvents(),
    event("graduation-announcement-2014-04-16", "2014-04-16", "G09", "regular", true),
    event("graduation-2014-05-11", "2014-05-11", "G09", "graduation", true),
    event("taiban-2014-06-26", "2014-06-26", "G09", "taiban", true),
    event("one-man-2014-07-27", "2014-07-27", "G10", "one-man", true),
    event("tif-2014-08-02", "2014-08-02", "G11", "festival", true),
  ];
}

export function createPrologueState(input: { saveId: string; difficulty?: Difficulty }): PrologueState {
  const gates = emptyGates();
  gates.G00 = true;
  return {
    saveId: input.saveId,
    difficulty: "normal", // legacy save compatibility; there is no difficulty selection
    date: "2013-01-07",
    apRemaining: 6,
    interviewedCandidateIds: [],
    members: founders,
    fan: createFanState(founders.map((member) => member.id)),
    gates,
    events: createPrologueSchedule(),
    finance: createFinanceState(3_000_000),
    monthlyReports: [],
    resolvedEventKeys: [],
    weeklyReviewHosts: [{ date: "2013-01-07", memberId: "IPC1-001" }],
  };
}

export function completeMandatoryInterview(state: PrologueState): PrologueState {
  return {
    ...state,
    interviewedCandidateIds: CANDIDATES.map(([id]) => id),
    gates: { ...state.gates, G01: true },
  };
}

export function spendInterviewAp(state: PrologueState, amount: number): PrologueState {
  if (!state.gates.G01 || !Number.isInteger(amount) || amount < 0 || amount > state.apRemaining) {
    throw new Error("Invalid interview AP spend");
  }
  return { ...state, apRemaining: state.apRemaining - amount };
}

export function signRoster(state: PrologueState, candidateIds: string[]): PrologueState {
  if (!state.gates.G01) throw new Error("All fifteen candidates must be interviewed first");
  if (new Set(candidateIds).size !== candidateIds.length || candidateIds.some((id) => !state.interviewedCandidateIds.includes(id))) {
    throw new Error("Roster contains an invalid or duplicate candidate");
  }
  const additions = candidateIds.map((id) => {
    const candidate = CANDIDATES.find(([candidateId]) => candidateId === id);
    if (!candidate) throw new Error(`Unknown candidate: ${id}`);
    return {
      id: candidate[0], nameJa: candidate[1], active: true,
      contractEndsOn: "2015-01-07", chekiCommissionRate: 0.2, fitnessCondition: 100,
      developedPalette: { red: 0, pink: 0, orange: 0, aqua: 0, yellow: 0, green: 0, blue: 0, purple: 0 },
    };
  });
  const members = [...founders, ...additions];
  return { ...state, members, fan: createFanState(members.map((member) => member.id)), gates: { ...state.gates, G02: true } };
}

export function completeStrategyAndOriginals(state: PrologueState): PrologueState {
  if (!state.gates.G02) throw new Error("Roster contracts are required before strategy and production");
  let finance = state.finance;
  const production = [
    { id: "making:original-1", amount: 180_000, category: "original_song" },
    { id: "making:original-2", amount: 180_000, category: "original_song" },
    { id: "making:initial-costume", amount: 30_000 + 25_000 * state.members.filter((member) => member.active).length, category: "initial_costume" },
  ];
  for (const item of production) {
    finance = postLedgerEntry(finance, {
      id: item.id, date: "2013-01-07", kind: "capitalized_asset", amount: item.amount,
      category: item.category, note: "Approved prologue production asset",
    });
  }
  return { ...state, finance, gates: { ...state.gates, G03: true, G04: true } };
}

function eventKey(state: PrologueState, runtimeEvent: RuntimeEvent): string {
  return `${state.saveId}:${runtimeEvent.gate}:${runtimeEvent.scenarioInstance}`;
}

function requiredGateFor(runtimeEvent: RuntimeEvent): PrologueGate | null {
  if (runtimeEvent.id === "debut-2013-05-24") return "G04";
  if (runtimeEvent.kind === "experimental-regular") return "G05";
  if (runtimeEvent.kind === "regular") return runtimeEvent.id === "graduation-announcement-2014-04-16" ? "G08" : "G07";
  if (runtimeEvent.kind === "graduation" || runtimeEvent.kind === "one-man") return "G09";
  if (runtimeEvent.kind === "festival") return "G10";
  return "G05";
}

export function markEventEligible(state: PrologueState, eventId: string): PrologueState {
  const runtimeEvent = state.events.find((item) => item.id === eventId);
  if (!runtimeEvent || runtimeEvent.status !== "DORMANT") {
    throw new Error(`Event is not dormant: ${eventId}`);
  }
  const requiredGate = requiredGateFor(runtimeEvent);
  if (requiredGate && !state.gates[requiredGate]) {
    throw new Error(`Event ${eventId} requires ${requiredGate}`);
  }
  return {
    ...state,
    events: state.events.map((item) => item.id === eventId ? { ...item, status: "ELIGIBLE" } : item),
  };
}

export function offerEligibleEvent(state: PrologueState, eventId: string): PrologueState {
  const runtimeEvent = state.events.find((item) => item.id === eventId);
  if (!runtimeEvent || runtimeEvent.status !== "ELIGIBLE") {
    throw new Error(`Event is not eligible: ${eventId}`);
  }
  return {
    ...state,
    events: state.events.map((item) => item.id === eventId ? { ...item, status: "OFFERED" } : item),
  };
}

/** Resolves once per save/gate/instance, so a replay never posts money twice. */
export function resolveLive(input: {
  state: PrologueState;
  eventId: string;
  participantIds?: string[];
  chekiSales?: ChekiSaleInput[];
  ports?: ParentRuntimePorts;
}): PrologueState {
  const runtimeEvent = input.state.events.find((item) => item.id === input.eventId);
  if (!runtimeEvent) throw new Error(`Unknown scheduled event: ${input.eventId}`);
  const key = eventKey(input.state, runtimeEvent);
  if (input.state.resolvedEventKeys.includes(key)) return input.state;
  if (runtimeEvent.status !== "OFFERED") {
    throw new Error(`Event must be offered before settlement: ${input.eventId}`);
  }
  const activeIds = input.state.members.filter((member) => member.active).map((member) => member.id);
  const participantIds = input.participantIds ?? activeIds;
  if (participantIds.some((id) => !activeIds.includes(id))) throw new Error("Inactive member cannot perform");
  const finalizedEvent = { ...runtimeEvent, status: "RESOLVED" as const, participantIds };
  const chekiLines = settleChekiSales({
    event: finalizedEvent,
    members: input.state.members,
    sales: input.chekiSales ?? [],
  });
  let finance = input.state.finance;
  for (const entry of chekiLedgerEntries({ event: finalizedEvent, date: finalizedEvent.date, lines: chekiLines })) {
    finance = postLedgerEntry(finance, entry);
  }
  input.ports?.performance?.({ liveId: finalizedEvent.id, participantIds, eventDate: finalizedEvent.date });
  input.ports?.fans?.({ liveId: finalizedEvent.id, participantIds, cheki: chekiLines });
  input.ports?.staff?.({ date: finalizedEvent.date, event: finalizedEvent, activeMembers: input.state.members.filter((member) => member.active) });
  const events = input.state.events.map((item) => item.id === finalizedEvent.id ? finalizedEvent : item);
  const gates = { ...input.state.gates, [finalizedEvent.gate]: true };
  return { ...input.state, date: finalizedEvent.date, events, gates, finance, resolvedEventKeys: [...input.state.resolvedEventKeys, key] };
}

export function isOctoberSmallGroupAugmentationEligible(state: PrologueState): boolean {
  const activeCount = state.members.filter((member) => member.active).length;
  return activeCount >= 3 && activeCount <= 7;
}

export function graduateRina(state: PrologueState): PrologueState {
  if (!state.resolvedEventKeys.some((key) => key.endsWith(":graduation-2014-05-11"))) {
    throw new Error("Rina may graduate only after her graduation live is settled");
  }
  const nextLeader = state.members.find((member) => member.active && member.id !== "IPC1-001");
  if (!nextLeader) throw new Error("An active leader is required after graduation");
  return {
    ...state,
    members: state.members.map((member) => member.id === "IPC1-001" ? { ...member, active: false } : member),
    weeklyReviewHosts: [...state.weeklyReviewHosts, { date: "2014-05-12", memberId: nextLeader.id }],
    gates: { ...state.gates, G09: true },
  };
}

export function routeCandidateIds(totalRoster: 3 | 5 | 9 | 15): string[] {
  return CANDIDATES.slice(0, totalRoster - FOUNDER_IDS.length).map(([id]) => id);
}
