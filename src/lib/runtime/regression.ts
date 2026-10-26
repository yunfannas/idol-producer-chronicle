import { fanChekiBalanceV1, requestProductsForBudget, sampleFanAttendance, samplePurchaseBudgetKJPY } from "./fan";
import { createSeededRandom, sampleBinomial, sampleHypergeometric } from "./random";
import type { FanState } from "./types";

export type MemberSales = {
  requestedJPY: number;
  requestedUnits: number;
  grossJPY: number;
  completedUnits: number;
  completedUnitsByTier: Record<"1000" | "2000", number>;
  variableCostJPY: number;
  buyerCount: number;
  affinityVisitors: number;
  queueLostJPY: number;
  queueLostBuyers: number;
  waitMinutes: number[];
  /** Completed newcomer vouchers are free services, never paid Cheki sales. */
  freeTrialRequested: number;
  freeTrialServed: number;
  freeTrialLost: number;
  freeTrialVariableCostJPY: number;
  /** Paid newcomer services share the queue and ledger, but remain auditable from existing-O purchases. */
  paidNewcomerRequested: number;
  paidNewcomerServed: number;
  paidNewcomerLost: number;
};

export type WeeklyRouteReport = {
  week: number;
  attendance: number;
  publicCount: number;
  otakuCount: number;
  affinityTotal: number;
  purchaseWeightMean: number;
  grossJPY: number;
  retainedJPY: number;
  queueLostJPY: number;
  cashFlowJPY: number;
  perMember: Record<string, MemberSales>;
};

export type RouteRegression = { rosterSize: number; seed: number; weeks: WeeklyRouteReport[] };

/** Deliberately neutral fixture, never read by the scenario Runtime. */
export const regressionFixtureV1 = {
  initialPublicCount: 300,
  initialOtakuCount: 40,
  initialAffinityShare: 0.6,
  initialPurchaseWeightKJPY: 2,
  weeklyTrainingCostJPY: 15_000,
  monthlyPayrollPerMemberJPY: 10_000,
  externalWatchingAudience: 30,
} as const;

const memberIdsFor = (rosterSize: number) => Array.from({ length: rosterSize }, (_, index) => `m-${index + 1}`);

function initialFan(memberIds: string[]): FanState {
  // Neutral regression fixture, deliberately not a narrative/Scenario seed.
  const otaku = regressionFixtureV1.initialOtakuCount;
  return {
    publicCount: regressionFixtureV1.initialPublicCount,
    otakuCount: otaku,
    temporarilyUnassignedOtaku: 0,
    members: Object.fromEntries(memberIds.map((id) => [id, {
      affinityCount: (otaku * regressionFixtureV1.initialAffinityShare) / memberIds.length,
      purchaseWeightKJPY: regressionFixtureV1.initialPurchaseWeightKJPY,
    }])),
  };
}

type TemporaryFan = {
  id: string;
  availableAt: number;
  orders: Map<string, Record<string, number>>;
  newcomerKind?: "free-trial" | "paid-newcomer";
};

function productPrice(id: string) { return id === "2000" ? 2000 : 1000; }
function productSeconds(id: string) { return id === "2000" ? fanChekiBalanceV1.cheki2000Seconds : fanChekiBalanceV1.cheki1000Seconds; }
function productVariableCost(id: string) { return id === "2000" ? fanChekiBalanceV1.cheki2000VariableCostJPY : fanChekiBalanceV1.cheki1000VariableCostJPY; }

function shuffled<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/** Shared-time FIFO approximation required by the v1 queue contract. */
export type ChekiServiceRecord = {
  fanId: string; memberId: string; startSeconds: number; endSeconds: number; grossJPY: number;
  waitMinutes: number;
  kind: "paid" | "free-trial" | "paid-newcomer";
};
export type FreeNewcomerTrialRequest = { id: string; memberId: string; source: "public" | "external" };
export type FreeNewcomerTrialConfig = {
  requests: FreeNewcomerTrialRequest[];
  serviceSeconds: number;
  variableCostJPY: number;
};
export type PaidNewcomerChekiRequest = { id: string; memberId: string; source: "public" | "external" };
export type PaidNewcomerChekiConfig = { requests: PaidNewcomerChekiRequest[] };
export function settleChekiQueue(input: {
  fan: FanState; memberIds: string[]; attendeeOtaku: number; seed: string;
  allowSales?: boolean;
  /** Contract-authorized free newcomer services share every member's real queue. */
  freeNewcomerTrials?: FreeNewcomerTrialConfig;
  /** First paid newcomer service; it uses the ordinary ¥1,000 product and the same FIFO queue. */
  paidNewcomerRequests?: PaidNewcomerChekiConfig;
  /** Event-local actual contact probability; absent means every attendee saw the member. */
  exposureProbabilityByMember?: Record<string, number>;
  onService?: (record: ChekiServiceRecord) => void;
  onAudience?: (audience: { eligibleExposedOWithoutAffinity: Record<string, number>; stayedOtaku: number }) => void;
  onAffinitySample?: (sample: { fanId: string; memberId: string; stayedForCheki: boolean }) => void;
}) {
  const random = createSeededRandom(input.seed);
  // Draw each attendee's stay decision ONCE, shared across every member.
  // U (temporarily unassigned Otaku) are present at the Live but cannot be
  // treated as assigned O for existing-member affinity acquisition.
  const population = Math.max(0, Math.round(input.fan.otakuCount));
  const attendeeCount = Math.min(population, Math.max(0, Math.round(input.attendeeOtaku)));
  const unassigned = Math.min(population, Math.max(0, Math.round(input.fan.temporarilyUnassignedOtaku)));
  const unassignedAttending = sampleHypergeometric({
    population, successes: unassigned, draws: attendeeCount, random,
  });
  const paidVisitors: (TemporaryFan & { stayedForCheki: boolean; unassigned: boolean })[] =
    Array.from({ length: attendeeCount }, (_, index) => ({
      id: `o-${index}`, availableAt: random() * 720, orders: new Map(),
      stayedForCheki: random() < fanChekiBalanceV1.pStayChekiOtaku,
      unassigned: false,
    }));
  for (const visitor of shuffled(paidVisitors, random).slice(0, unassignedAttending)) {
    visitor.unassigned = true;
  }
  const assignedVisitors = paidVisitors.filter((visitor) => !visitor.unassigned);
  const trialVisitors: TemporaryFan[] = (input.freeNewcomerTrials?.requests ?? [])
    .filter((request) => input.memberIds.includes(request.memberId))
    .map((request) => ({
      id: `trial:${request.id}`,
      availableAt: random() * 720,
      orders: new Map([[request.memberId, { trial: 1 }]]),
      newcomerKind: "free-trial",
    }));
  const paidNewcomerVisitors: TemporaryFan[] = (input.paidNewcomerRequests?.requests ?? [])
    .filter((request) => input.memberIds.includes(request.memberId))
    .map((request) => ({
      id: `newcomer:${request.id}`,
      availableAt: random() * 720,
      orders: new Map([[request.memberId, { "1000": 1 }]]),
      newcomerKind: "paid-newcomer",
    }));
  const visitors: TemporaryFan[] = [...paidVisitors, ...trialVisitors, ...paidNewcomerVisitors];
  const assignedPopulation = population - unassigned;
  const eligibleExposedOWithoutAffinity: Record<string, number> = {};
  const sales: Record<string, MemberSales> = Object.fromEntries(input.memberIds.map((id) => [id, {
    requestedJPY: 0, requestedUnits: 0, grossJPY: 0, completedUnits: 0,
    completedUnitsByTier: { "1000": 0, "2000": 0 }, variableCostJPY: 0,
    buyerCount: 0, affinityVisitors: 0, queueLostJPY: 0, queueLostBuyers: 0, waitMinutes: [],
    freeTrialRequested: 0, freeTrialServed: 0, freeTrialLost: 0, freeTrialVariableCostJPY: 0,
    paidNewcomerRequested: 0, paidNewcomerServed: 0, paidNewcomerLost: 0,
  }]));
  for (const request of input.freeNewcomerTrials?.requests ?? []) {
    if (sales[request.memberId]) sales[request.memberId].freeTrialRequested += 1;
  }
  for (const request of input.paidNewcomerRequests?.requests ?? []) {
    if (sales[request.memberId]) {
      sales[request.memberId].paidNewcomerRequested += 1;
      // A paid newcomer request is the ordinary ¥1,000 product.  It must be
      // present in the same request totals used by the shared-queue capacity
      // assertion; only completed units are later booked as revenue.
      sales[request.memberId].requestedUnits += 1;
      sales[request.memberId].requestedJPY += 1_000;
    }
  }
  for (const memberId of input.memberIds) {
    const profile = input.fan.members[memberId];
    const affinityVisitors = sampleHypergeometric({
      population: assignedPopulation,
      successes: profile.affinityCount,
      draws: assignedVisitors.length,
      random,
    });
    const affinitySample = shuffled(assignedVisitors, random).slice(0, affinityVisitors);
    const affinityVisitorIds = new Set(affinitySample.map((visitor) => visitor.id));
    const notAffinity = assignedVisitors.filter((visitor) => !affinityVisitorIds.has(visitor.id));
    const exposureProbability = input.exposureProbabilityByMember?.[memberId];
    eligibleExposedOWithoutAffinity[memberId] = exposureProbability === undefined
      ? notAffinity.length
      : sampleBinomial(notAffinity.length, Math.min(1, Math.max(0, exposureProbability)), random);
    for (const visitor of affinitySample) {
      input.onAffinitySample?.({ fanId: visitor.id, memberId, stayedForCheki: visitor.stayedForCheki });
      if (input.allowSales === false) continue;
      if (!visitor.stayedForCheki) continue;
      sales[memberId].affinityVisitors += 1;
      const budget = samplePurchaseBudgetKJPY(profile.purchaseWeightKJPY, random);
      const request = requestProductsForBudget({
        budgetKJPY: budget, weightKJPY: profile.purchaseWeightKJPY,
        products: [{ id: "1000", priceJPY: 1000 }, { id: "2000", priceJPY: 2000 }], random,
      });
      const requested = Object.entries(request).reduce((sum, [id, units]) => sum + productPrice(id) * units, 0);
      if (requested > 0) {
        sales[memberId].requestedJPY += requested;
        sales[memberId].requestedUnits += Object.values(request).reduce((sum, count) => sum + count, 0);
        visitor.orders.set(memberId, request);
      }
    }
  }
  input.onAudience?.({
    eligibleExposedOWithoutAffinity,
    stayedOtaku: paidVisitors.filter((visitor) => visitor.stayedForCheki).length,
  });
  const nextAvailable = Object.fromEntries(input.memberIds.map((id) => [id, 0])) as Record<string, number>;
  let guard = 0;
  while (visitors.some((visitor) => visitor.orders.size > 0) && guard < 20_000) {
    guard += 1;
    const visitor = visitors.filter((candidate) => candidate.orders.size > 0)
      .sort((left, right) => left.availableAt - right.availableAt || left.id.localeCompare(right.id))[0];
    const memberId = [...visitor.orders.keys()].sort((left, right) => {
      const spend = (id: string) => Object.entries(visitor.orders.get(id) ?? {}).reduce((sum, [productId, units]) => sum + productPrice(productId) * units, 0);
      const leftWait = Math.max(0, nextAvailable[left] - visitor.availableAt) / 60;
      const rightWait = Math.max(0, nextAvailable[right] - visitor.availableAt) / 60;
      return spend(right) / (1 + rightWait / 30) - spend(left) / (1 + leftWait / 30) || left.localeCompare(right);
    })[0];
    const requested = visitor.orders.get(memberId)!;
    const units = Object.entries(requested).flatMap(([id, count]) => Array.from({ length: count }, () => id)).slice(0, fanChekiBalanceV1.maxConsecutive);
    const freeTrial = visitor.newcomerKind === "free-trial" && units.includes("trial");
    const paidNewcomer = visitor.newcomerKind === "paid-newcomer";
    const spend = units.reduce((sum, id) => sum + (id === "trial" ? 0 : productPrice(id)), 0);
    const start = Math.max(visitor.availableAt, nextAvailable[memberId]);
    const wait = (start - visitor.availableAt) / 60;
    const tolerance = Math.min(90, Math.max(10, 10 + 12 * Math.log(1 + spend / 1000)));
    const serviceSeconds = units.reduce<number>((sum, id) => sum + (id === "trial" ? (input.freeNewcomerTrials?.serviceSeconds ?? 0) : productSeconds(id)), fanChekiBalanceV1.fanChangeOverheadSeconds);
    if (start + serviceSeconds > fanChekiBalanceV1.chekiMinutes * 60 || (wait > tolerance && random() < 1 - Math.exp(-(wait - tolerance) / fanChekiBalanceV1.queueExtraAbandonScaleMinutes))) {
      if (freeTrial) sales[memberId].freeTrialLost += 1;
      else if (paidNewcomer) {
        sales[memberId].paidNewcomerLost += 1;
        sales[memberId].queueLostJPY += spend;
        sales[memberId].queueLostBuyers += 1;
      }
      else {
        sales[memberId].queueLostJPY += Object.entries(requested).reduce((sum, [id, count]) => sum + (id === "trial" ? 0 : productPrice(id)) * count, 0);
        sales[memberId].queueLostBuyers += 1;
      }
      visitor.orders.delete(memberId);
      continue;
    }
    if (freeTrial) {
      sales[memberId].freeTrialServed += 1;
      sales[memberId].freeTrialVariableCostJPY += input.freeNewcomerTrials?.variableCostJPY ?? 0;
    } else {
      sales[memberId].grossJPY += spend;
      sales[memberId].completedUnits += units.length;
      for (const id of units) sales[memberId].completedUnitsByTier[id === "2000" ? "2000" : "1000"] += 1;
      sales[memberId].variableCostJPY += units.reduce<number>((sum, id) => sum + productVariableCost(id), 0);
      sales[memberId].buyerCount += 1;
      if (paidNewcomer) sales[memberId].paidNewcomerServed += 1;
    }
    sales[memberId].waitMinutes.push(wait);
    nextAvailable[memberId] = start + serviceSeconds;
    input.onService?.({ fanId: visitor.id, memberId, startSeconds: start, endSeconds: nextAvailable[memberId], grossJPY: spend, waitMinutes: wait, kind: freeTrial ? "free-trial" : paidNewcomer ? "paid-newcomer" : "paid" });
    visitor.availableAt = nextAvailable[memberId];
    for (const id of units) {
      requested[id] -= 1;
      if (requested[id] === 0) delete requested[id];
    }
    if (Object.keys(requested).length === 0) visitor.orders.delete(memberId);
  }
  return sales;
}

export type GrowthFixtureOptions = {
  liveQualityFactor?: number; // performance / satisfaction; neutral 1
  interactionQualityBonus?: number; // normalized positive FanEngage; neutral 0
  externalWatchingAudience?: number; // actual watchers, not owned O/P
  attendanceImportance?: number; // 0 means no existing O/P exposure
};

function settleWeek(input: { fan: FanState; memberIds: string[]; seed: string; rosterSize: number; week: number; fixture?: GrowthFixtureOptions }) {
  const attendance = sampleFanAttendance({ fan: input.fan, kind: "taiban", seed: `${input.seed}:attendance`, attendanceImportance: input.fixture?.attendanceImportance, externalWatchingAudience: input.fixture?.externalWatchingAudience ?? regressionFixtureV1.externalWatchingAudience });
  let eligibleExposedOWithoutAffinity: Record<string, number> = {};
  const sales = settleChekiQueue({
    fan: input.fan, memberIds: input.memberIds, attendeeOtaku: attendance.otaku,
    seed: `${input.seed}:queue`,
    onAudience: (audience) => { eligibleExposedOWithoutAffinity = audience.eligibleExposedOWithoutAffinity; },
  });
  const random = createSeededRandom(`${input.seed}:fans`);
  const quality = Math.max(0, input.fixture?.liveQualityFactor ?? 1);
  const publicToOtaku = sampleBinomial(attendance.public, Math.min(1, fanChekiBalanceV1.pPublicToOtaku * quality), random);
  const externalToOtaku = sampleBinomial(attendance.external, Math.min(1, fanChekiBalanceV1.pExternalToOtaku * quality), random);
  const externalToPublic = sampleBinomial(attendance.external - externalToOtaku, Math.min(1, fanChekiBalanceV1.pExternalToPublic * quality), random);
  const survivingP = input.fan.publicCount * (1 - fanChekiBalanceV1.pWeeklyPChurn) - publicToOtaku + externalToPublic;
  const survivingO = input.fan.otakuCount * (1 - fanChekiBalanceV1.pWeeklyOChurn) + publicToOtaku + externalToOtaku;
  const members = Object.fromEntries(input.memberIds.map((memberId) => {
    const current = input.fan.members[memberId];
    const memberSales = sales[memberId];
    const exposureShare = 1 / input.memberIds.length;
    const newAffinity = (publicToOtaku + externalToOtaku) * exposureShare + sampleBinomial(
      eligibleExposedOWithoutAffinity[memberId] ?? 0,
      Math.min(1, fanChekiBalanceV1.pExistingOtakuToAffinity * exposureShare * quality),
      random,
    );
    const served = memberSales.buyerCount / Math.max(1, memberSales.affinityVisitors);
    const lost = memberSales.queueLostBuyers / Math.max(1, memberSales.affinityVisitors);
    const averageWait = memberSales.waitMinutes.reduce((sum, wait) => sum + wait, 0) / Math.max(1, memberSales.waitMinutes.length);
    const engagement = Math.max(0, 1 + (input.fixture?.interactionQualityBonus ?? 0) - 0.2 * Math.min(1, averageWait / 60));
    const logW = Math.min(0.05, Math.max(-0.05, 0.015 * served * (engagement - 1) - 0.01 * lost));
    return [memberId, {
      affinityCount: Math.min(survivingO, current.affinityCount * (1 - fanChekiBalanceV1.pWeeklyOChurn) * (1 - fanChekiBalanceV1.pWeeklyAffinityChurn) + newAffinity),
      purchaseWeightKJPY: current.purchaseWeightKJPY * Math.exp(logW),
    }];
  }));
  const fan: FanState = { publicCount: Math.max(0, survivingP), otakuCount: Math.max(0, survivingO), temporarilyUnassignedOtaku: 0, members };
  const grossJPY = Object.values(sales).reduce((sum, sale) => sum + sale.grossJPY, 0);
  const variableCostJPY = Object.values(sales).reduce((sum, sale) => sum + sale.variableCostJPY, 0);
  const retainedJPY = grossJPY * 0.8 - variableCostJPY;
  const payroll = input.week % 4 === 0 ? input.rosterSize * regressionFixtureV1.monthlyPayrollPerMemberJPY : 0;
  const cashFlowJPY = retainedJPY - regressionFixtureV1.weeklyTrainingCostJPY - payroll;
  return { fan, attendance, sales, grossJPY, retainedJPY, cashFlowJPY };
}

export function runTwelveWeekRoute(rosterSize: 5 | 9 | 15, seed: number, fixture?: GrowthFixtureOptions): RouteRegression {
  const memberIds = memberIdsFor(rosterSize);
  let fan = initialFan(memberIds);
  const weeks: WeeklyRouteReport[] = [];
  for (let week = 1; week <= 12; week += 1) {
    const settled = settleWeek({ fan, memberIds, seed: `${seed}:${week}`, rosterSize, week, fixture });
    fan = settled.fan;
    const memberProfiles = Object.values(fan.members);
    weeks.push({
      week, attendance: settled.attendance.otaku + settled.attendance.public + settled.attendance.external,
      publicCount: fan.publicCount, otakuCount: fan.otakuCount,
      affinityTotal: memberProfiles.reduce((sum, profile) => sum + profile.affinityCount, 0),
      purchaseWeightMean: memberProfiles.reduce((sum, profile) => sum + profile.purchaseWeightKJPY, 0) / memberProfiles.length,
      grossJPY: settled.grossJPY, retainedJPY: settled.retainedJPY,
      queueLostJPY: Object.values(settled.sales).reduce((sum, sale) => sum + sale.queueLostJPY, 0),
      cashFlowJPY: settled.cashFlowJPY, perMember: settled.sales,
    });
  }
  return { rosterSize, seed, weeks };
}

export function runRegressionMatrix(): RouteRegression[] {
  return ([5, 9, 15] as const).flatMap((rosterSize) => Array.from({ length: 20 }, (_, index) => runTwelveWeekRoute(rosterSize, index + 1)));
}
