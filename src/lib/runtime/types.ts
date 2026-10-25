/**
 * Chronicle's integration boundary for the parent simulation.  These types
 * deliberately do not expose a second fan-growth or performance-scoring model.
 */

export type Difficulty = "easy" | "normal" | "hard";
export type Color8 = "red" | "pink" | "orange" | "aqua" | "yellow" | "green" | "blue" | "purple";
export type SongPalette = Record<Color8, number>;
export type DevelopedPalette = Record<Color8, number>;
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
  monthlySalary?: number;
  fitnessCondition: number;
  developedPalette?: DevelopedPalette;
};

/** Fan Market v0.2 / executable v1: Core and BoxRate are intentionally absent. */
export type FanState = {
  publicCount: number;
  otakuCount: number;
  temporarilyUnassignedOtaku: number;
  members: Record<string, { affinityCount: number; purchaseWeightKJPY: number }>;
};

export type FanAttendance = {
  otaku: number;
  public: number;
  external: number;
  frequencyFactor: number;
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

/** Optional integration hooks; local implementation owns its persisted state. */
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
  fan: FanState;
  gates: Record<PrologueGate, boolean>;
  events: RuntimeEvent[];
  finance: FinanceState;
  monthlyReports: MonthlyOperatingReport[];
  resolvedEventKeys: string[];
  weeklyReviewHosts: { date: string; memberId: string }[];
};

export type MonthlyOperatingReport = {
  month: string;
  openingCash: number;
  closingCash: number;
  operatingRevenue: number;
  operatingCost: number;
  capitalizedAssets: number;
  loans: number;
  note: string;
};

export type DayAdvanceResult = {
  state: PrologueState;
  advancedDays: number;
  blockingGate?: PrologueGate;
  awaitingSettlementEventId?: string;
};
