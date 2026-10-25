/**
 * Chronicle's integration boundary for the parent simulation.  These types
 * deliberately do not expose a second fan-growth or performance-scoring model.
 */

export type Difficulty = "easy" | "normal" | "hard";
export type EventStatus =
  | "DORMANT"
  | "ELIGIBLE"
  | "OFFERED"
  | "RESOLVED"
  | "EXPIRED"
  | "SUPERSEDED";
export type PrologueGate =
  | "G00"
  | "G01"
  | "G02"
  | "G03"
  | "G04"
  | "G05"
  | "G06"
  | "G07"
  | "G08"
  | "G09"
  | "G10"
  | "G11"
  | "G12";
export type LiveKind =
  | "debut"
  | "taiban"
  | "free-mall"
  | "experimental-regular"
  | "regular"
  | "graduation"
  | "one-man"
  | "festival"
  | "closed";

export type RuntimeMember = {
  id: string;
  nameJa: string;
  active: boolean;
  contractEndsOn: string;
  chekiCommissionRate: number;
  fitnessCondition: number;
};

export type ActivityLoad = {
  general: number;
  vocal: number;
  physical: number;
};

export type RuntimeEvent = {
  id: string;
  date: string;
  gate: PrologueGate;
  kind: LiveKind;
  status: EventStatus;
  scenarioInstance: string;
  chekiAllowed: boolean;
  participantIds: string[];
};

export type LedgerKind =
  | "operating_revenue"
  | "operating_cost"
  | "capitalized_asset"
  | "loan_proceeds"
  | "loan_repayment";

export type LedgerEntry = {
  id: string;
  date: string;
  kind: LedgerKind;
  amount: number;
  category: string;
  eventId?: string;
  memberId?: string;
  note: string;
};

export type FinanceState = {
  cash: number;
  operatingRevenue: number;
  operatingCost: number;
  capitalizedAssets: number;
  loans: number;
  entries: LedgerEntry[];
};

export type ChekiTier = {
  id: "1000" | "2000";
  price: 1000 | 2000;
  variableCostPerUnit: number;
  slotsPerUnit: number;
};

export type ChekiSaleInput = {
  memberId: string;
  tierId: ChekiTier["id"];
  units: number;
};

export type ChekiSettlementLine = {
  memberId: string;
  tierId: ChekiTier["id"];
  units: number;
  grossSales: number;
  memberShare: number;
  variableCost: number;
  retained: number;
  slotsUsed: number;
};

/**
 * The parent runtime owns these hidden systems. Chronicle supplies actual
 * completed-event facts, then consumes its result without inspecting raw
 * Performance or conversion values in player-facing reports.
 */
export type ParentRuntimePorts = {
  performance?: (input: {
    liveId: string;
    participantIds: string[];
    eventDate: string;
  }) => void;
  fans?: (input: {
    liveId: string;
    participantIds: string[];
    cheki: ChekiSettlementLine[];
  }) => void;
  staff?: (input: {
    date: string;
    event: RuntimeEvent;
    activeMembers: RuntimeMember[];
  }) => string[];
};

export type PrologueState = {
  saveId: string;
  difficulty: Difficulty;
  date: string;
  apRemaining: number;
  interviewedCandidateIds: string[];
  members: RuntimeMember[];
  gates: Record<PrologueGate, boolean>;
  events: RuntimeEvent[];
  finance: FinanceState;
  resolvedEventKeys: string[];
  weeklyReviewHosts: { date: string; memberId: string }[];
};
