import { createMonthlyOperatingReport, postLedgerEntry } from "./finance";
import {
  completeMandatoryInterview,
  completeStrategyAndOriginals,
  markEventEligible,
  offerEligibleEvent,
  routeCandidateIds,
  signRoster,
} from "./prologue";
import type { DayAdvanceResult, PrologueState } from "./types";

const nextDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

function postScheduledCosts(state: PrologueState, date: string): PrologueState {
  let finance = state.finance;
  const day = date.slice(-2);
  const utcDay = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (day === "01") {
    const payroll = state.members.filter((member) => member.active)
      .reduce((sum, member) => sum + (member.monthlySalary ?? 10_000), 0);
    if (payroll > 0) {
      finance = postLedgerEntry(finance, {
        id: `payroll:${date}`, date, kind: "operating_cost", amount: payroll,
        category: "member_payroll", note: "Monthly member contract payroll",
      });
    }
  }
  // Medium training is the current approved opening policy: 3 × 2h shared
  // room sessions each week, never multiplied by roster size.
  if (utcDay === 1 && state.gates.G03) {
    finance = postLedgerEntry(finance, {
      id: `training-room:${date}`, date, kind: "operating_cost", amount: 15_000,
      category: "training_room", note: "Shared medium training room, 6 hours",
    });
  }
  return finance === state.finance ? state : { ...state, finance };
}

function finalizePreviousMonth(state: PrologueState, date: string): PrologueState {
  if (!date.endsWith("-01")) return state;
  const current = new Date(`${date}T00:00:00Z`);
  current.setUTCMonth(current.getUTCMonth() - 1);
  const month = current.toISOString().slice(0, 7);
  if (state.monthlyReports.some((report) => report.month === month)) return state;
  const report = createMonthlyOperatingReport({
    finance: state.finance,
    month,
    // The report reconciliation is entry-ledger based; this produces a
    // checkable cash movement even before a full balance-sheet adapter exists.
    openingCash: state.finance.cash - state.finance.entries
      .filter((entry) => entry.date.startsWith(month))
      .reduce((delta, entry) => delta + (entry.kind === "operating_revenue" || entry.kind === "loan_proceeds" ? entry.amount : -entry.amount), 0),
  });
  return { ...state, monthlyReports: [...state.monthlyReports, report] };
}

/**
 * Test-route bootstrap. It executes the compulsory interview before signing a
 * chosen route, rather than treating roster size as a bypass of G01.
 */
export function startTestRoute(state: PrologueState, rosterSize: 3 | 5 | 9 | 15): PrologueState {
  const interviewed = completeMandatoryInterview(state);
  const contracted = signRoster(interviewed, routeCandidateIds(rosterSize));
  return completeStrategyAndOriginals(contracted);
}

/** Advances at most seven JST dates. Routine Live never invents a settlement. */
export function advanceWithStaff(state: PrologueState, maxDays = 7): DayAdvanceResult {
  if (!Number.isInteger(maxDays) || maxDays < 1 || maxDays > 7) {
    throw new Error("Advance range must be 1 through 7 days");
  }
  if (!state.gates.G01) return { state, advancedDays: 0, blockingGate: "G01" };
  if (!state.gates.G02) return { state, advancedDays: 0, blockingGate: "G02" };
  if (!state.gates.G03) return { state, advancedDays: 0, blockingGate: "G03" };
  if (!state.gates.G04) return { state, advancedDays: 0, blockingGate: "G04" };

  let next = state;
  for (let advancedDays = 0; advancedDays < maxDays; advancedDays += 1) {
    const date = nextDate(next.date);
    next = finalizePreviousMonth(postScheduledCosts(next, date), date);
    const scheduled = next.events.find((event) => event.date === date && event.status === "DORMANT");
    if (scheduled) {
      // Staff may make the scheduled event eligible and offer it, but only the
      // approved parent Performance/Fan/Cheki adapter may supply its facts.
      next = offerEligibleEvent(markEventEligible(next, scheduled.id), scheduled.id);
      return { state: { ...next, date }, advancedDays: advancedDays + 1, awaitingSettlementEventId: scheduled.id };
    }
    next = { ...next, date };
  }
  return { state: next, advancedDays: maxDays };
}
