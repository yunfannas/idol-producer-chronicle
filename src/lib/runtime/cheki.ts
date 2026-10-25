import type {
  ChekiSaleInput,
  ChekiSettlementLine,
  ChekiTier,
  LedgerEntry,
  RuntimeEvent,
  RuntimeMember,
} from "./types";

export const DEFAULT_CHEKI_TIERS: ChekiTier[] = [
  { id: "1000", price: 1000, variableCostPerUnit: 0, slotsPerUnit: 1 },
  { id: "2000", price: 2000, variableCostPerUnit: 0, slotsPerUnit: 2 },
];

export function settleChekiSales(input: {
  event: RuntimeEvent;
  members: RuntimeMember[];
  sales: ChekiSaleInput[];
  tiers?: ChekiTier[];
}): ChekiSettlementLine[] {
  const { event, members, sales, tiers = DEFAULT_CHEKI_TIERS } = input;
  if (!event.chekiAllowed && sales.some((sale) => sale.units > 0)) {
    throw new Error(`Cheki is not permitted for ${event.id}`);
  }
  const tierById = new Map(tiers.map((tier) => [tier.id, tier]));
  const memberById = new Map(members.map((member) => [member.id, member]));
  return sales.filter((sale) => sale.units > 0).map((sale) => {
    if (!Number.isInteger(sale.units)) throw new Error("Cheki units must be an integer");
    const member = memberById.get(sale.memberId);
    const tier = tierById.get(sale.tierId);
    if (!member || !member.active || !event.participantIds.includes(sale.memberId)) {
      throw new Error(`Cheki member is not an eligible participant: ${sale.memberId}`);
    }
    if (!tier) throw new Error(`Unknown Cheki tier: ${sale.tierId}`);
    const grossSales = sale.units * tier.price;
    const memberShare = grossSales * member.chekiCommissionRate;
    const variableCost = sale.units * tier.variableCostPerUnit;
    return {
      memberId: sale.memberId,
      tierId: tier.id,
      units: sale.units,
      grossSales,
      memberShare,
      variableCost,
      retained: grossSales - memberShare - variableCost,
      slotsUsed: sale.units * tier.slotsPerUnit,
    };
  });
}

export function chekiLedgerEntries(input: {
  event: RuntimeEvent;
  date: string;
  lines: ChekiSettlementLine[];
}): LedgerEntry[] {
  return input.lines.flatMap((line) => {
    const prefix = `${input.event.id}:cheki:${line.memberId}:${line.tierId}`;
    const common = { date: input.date, eventId: input.event.id, memberId: line.memberId };
    return [
      {
        ...common,
        id: `${prefix}:gross`,
        kind: "operating_revenue" as const,
        amount: line.grossSales,
        category: "cheki_sales",
        note: `${line.tierId} Cheki gross sales`,
      },
      ...(line.memberShare > 0
        ? [{
            ...common,
            id: `${prefix}:member-share`,
            kind: "operating_cost" as const,
            amount: line.memberShare,
            category: "cheki_member_share",
            note: "Member Cheki commission",
          }]
        : []),
      ...(line.variableCost > 0
        ? [{
            ...common,
            id: `${prefix}:variable-cost`,
            kind: "operating_cost" as const,
            amount: line.variableCost,
            category: "cheki_variable_cost",
            note: "Cheki variable cost",
          }]
        : []),
    ];
  });
}
