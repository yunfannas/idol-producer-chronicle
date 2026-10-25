import type { FinanceState, LedgerEntry, LedgerKind, MonthlyOperatingReport } from "./types";

export const INITIAL_CASH: Record<"easy" | "normal" | "hard", number> = {
  easy: 5_000_000,
  normal: 3_000_000,
  hard: 1_800_000,
};

export function createFinanceState(initialCash: number): FinanceState {
  return {
    cash: initialCash,
    operatingRevenue: 0,
    operatingCost: 0,
    capitalizedAssets: 0,
    loans: 0,
    entries: [],
  };
}

function requirePositiveAmount(entry: LedgerEntry) {
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) {
    throw new Error(`Ledger amount must be positive: ${entry.id}`);
  }
}

/** Posts gross revenue and each real cost separately; never posts a net twice. */
export function postLedgerEntry(
  finance: FinanceState,
  entry: LedgerEntry,
): FinanceState {
  requirePositiveAmount(entry);
  if (finance.entries.some((existing) => existing.id === entry.id)) {
    return finance;
  }

  const next: FinanceState = {
    ...finance,
    entries: [...finance.entries, entry],
  };
  switch (entry.kind as LedgerKind) {
    case "operating_revenue":
      next.cash += entry.amount;
      next.operatingRevenue += entry.amount;
      break;
    case "operating_cost":
      next.cash -= entry.amount;
      next.operatingCost += entry.amount;
      break;
    case "capitalized_asset":
      next.cash -= entry.amount;
      next.capitalizedAssets += entry.amount;
      break;
    case "loan_proceeds":
      next.cash += entry.amount;
      next.loans += entry.amount;
      break;
    case "loan_repayment":
      if (entry.amount > next.loans) {
        throw new Error("Loan repayment exceeds outstanding loan balance");
      }
      next.cash -= entry.amount;
      next.loans -= entry.amount;
      break;
  }
  return next;
}

export function createMonthlyOperatingReport(input: {
  finance: FinanceState;
  month: string;
  openingCash: number;
}): MonthlyOperatingReport {
  const entries = input.finance.entries.filter((entry) => entry.date.startsWith(input.month));
  const amountFor = (kind: LedgerKind) => entries
    .filter((entry) => entry.kind === kind)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const revenue = amountFor("operating_revenue");
  const cost = amountFor("operating_cost");
  const capitalizedAssets = amountFor("capitalized_asset");
  const loanChange = amountFor("loan_proceeds") - amountFor("loan_repayment");
  return {
    month: input.month,
    openingCash: input.openingCash,
    closingCash: input.openingCash + revenue - cost - capitalizedAssets + loanChange,
    operatingRevenue: revenue,
    operatingCost: cost,
    capitalizedAssets,
    loans: loanChange,
    note: "Fan cohort and hidden Performance values require the approved parent Runtime adapter.",
  };
}

/** v0.10 §4: safe fallback when the attribution pool has no denominator. */
export function calculateTaibanTicketRevenue(input: {
  totalReceipts: number;
  participatingGroupCount: number;
  groupNominatedAdmissions: number;
  allNominatedAdmissions: number | null;
  fallbackAttributionRevenue?: number;
}): number {
  const {
    totalReceipts,
    participatingGroupCount,
    groupNominatedAdmissions,
    allNominatedAdmissions,
    fallbackAttributionRevenue = 0,
  } = input;
  if (totalReceipts < 0 || participatingGroupCount < 1 || groupNominatedAdmissions < 0) {
    throw new Error("Invalid taiban ticket settlement input");
  }
  const equalPool = totalReceipts * (0.15 / participatingGroupCount);
  if (allNominatedAdmissions === null || allNominatedAdmissions <= 0) {
    return equalPool + fallbackAttributionRevenue;
  }
  return (
    equalPool +
    totalReceipts * 0.25 * (groupNominatedAdmissions / allNominatedAdmissions)
  );
}
