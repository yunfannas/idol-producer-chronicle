import { describe, expect, it } from "vitest";
import { DEFAULT_CHEKI_TIERS, settleChekiSales } from "./cheki";
import { calculateTaibanTicketRevenue, postLedgerEntry } from "./finance";
import { applyActivityLoad, conditionAmplifier, liveSongGeneralLoad } from "./performance";
import { advanceWithStaff, startTestRoute } from "./operations";
import { applyWeeklyFanDecay, createFanState, fanChekiBalanceV1, requestProductsForBudget, sampleFanAttendance, samplePurchaseBudgetKJPY } from "./fan";
import { createSeededRandom } from "./random";
import { emptyPalette, finalPaletteExecution, paletteMultiplier } from "./palette";
import {
  completeMandatoryInterview,
  completeStrategyAndOriginals,
  createPrologueSchedule,
  createPrologueState,
  graduateRina,
  isOctoberSmallGroupAugmentationEligible,
  markEventEligible,
  offerEligibleEvent,
  resolveLive,
  prologueFounderFanSeedV1,
  routeCandidateIds,
  signRoster,
  spendInterviewAp,
} from "./prologue";
import type { RuntimeEvent, RuntimeMember } from "./types";
import { loadOrCreateSave, resetLocalSave, savePrologueState } from "./save-repository.server";

function offer(state: ReturnType<typeof createPrologueState>, eventId: string) {
  return offerEligibleEvent(markEventEligible(state, eventId), eventId);
}

describe("Chronicle parent-runtime contracts", () => {
  it("uses the locked eight-color PE and applies its multiplier once", () => {
    const yellowSong = { ...emptyPalette(), yellow: 1 };
    const participant = { ...emptyPalette(0), yellow: 100, red: 100 };
    const finalPE = finalPaletteExecution({
      song: yellowSong,
      participantPalettes: [participant],
      keyParts: [{ maxBonus: 8, dutyPalette: participant, familiarity: 100 }],
    });
    expect(finalPE).toBe(100);
    expect(paletteMultiplier(45)).toBe(1);
    expect(paletteMultiplier(100)).toBe(2);
  });

  it("uses one deterministic P/O audience and keeps fan decay aggregate-only", () => {
    const fan = createFanState(["member"], { publicCount: 500, otakuCount: 300 });
    fan.members.member = { affinityCount: 80, purchaseWeightKJPY: 3 };
    const first = sampleFanAttendance({ fan, kind: "taiban", seed: "live-1" });
    const replay = sampleFanAttendance({ fan, kind: "taiban", seed: "live-1" });
    expect(first).toEqual(replay);
    expect(first.frequencyFactor).toBe(1);
    const decayed = applyWeeklyFanDecay(fan);
    expect(decayed.publicCount).toBeCloseTo(500 * (1 - fanChekiBalanceV1.pWeeklyPChurn));
    expect(decayed.members.member.affinityCount).toBeLessThan(80);
    expect("coreCount" in decayed).toBe(false);
  });

  it("models W as mean purchase intent before the queue, not guaranteed sales", () => {
    const random = createSeededRandom("gamma-smoke");
    const samples = Array.from({ length: 20_000 }, () => samplePurchaseBudgetKJPY(3, random));
    expect(samples.reduce((sum, sample) => sum + sample, 0) / samples.length).toBeCloseTo(3, 1);
    const request = requestProductsForBudget({
      budgetKJPY: 3, weightKJPY: 3,
      products: [{ id: "1000", priceJPY: 1000 }, { id: "2000", priceJPY: 2000 }],
      random: createSeededRandom("products"),
    });
    expect((request["1000"] ?? 0) + (request["2000"] ?? 0)).toBeGreaterThan(0);
  });

  it("uses the locked unified condition load equation without separate fatigue bars", () => {
    const member: RuntimeMember = {
      id: "member", nameJa: "Test", active: true, contractEndsOn: "2015-01-07",
      chekiCommissionRate: 0.2, fitnessCondition: 100,
    };
    expect(conditionAmplifier(0)).toBeCloseTo(0.6209, 3);
    expect(liveSongGeneralLoad(12, 12)).toBeCloseTo(3, 8);
    const result = applyActivityLoad({
      member,
      load: { general: 3, vocal: 99, physical: 99 },
      stamina: 10,
    });
    expect(result.fitnessCondition).toBeCloseTo(98.137, 3);
  });

  it("records Cheki gross sales, the member's 20% share, and variable cost exactly once", () => {
    const member: RuntimeMember = {
      id: "member", nameJa: "Test", active: true, contractEndsOn: "2015-01-07",
      chekiCommissionRate: 0.2, fitnessCondition: 100,
    };
    const event: RuntimeEvent = {
      id: "live", date: "2013-05-24", gate: "G05", kind: "debut", status: "RESOLVED",
      scenarioInstance: "live", chekiAllowed: true, participantIds: [member.id],
    };
    const lines = settleChekiSales({
      event, members: [member], sales: [{ memberId: member.id, tierId: "1000", units: 2 }, { memberId: member.id, tierId: "2000", units: 1 }],
      tiers: [
        { ...DEFAULT_CHEKI_TIERS[0], variableCostPerUnit: 210 },
        { ...DEFAULT_CHEKI_TIERS[1], variableCostPerUnit: 210 },
      ],
    });
    expect(lines.map((line) => line.retained)).toEqual([1180, 1390]);
    expect(lines.reduce((total, line) => total + line.slotsUsed, 0)).toBe(4);
  });

  it("uses normal-event ticket sharing and a safe zero-attribution fallback", () => {
    expect(calculateTaibanTicketRevenue({
      totalReceipts: 100_000,
      participatingGroupCount: 4,
      groupNominatedAdmissions: 20,
      allNominatedAdmissions: 100,
    })).toBe(8_750);
    expect(calculateTaibanTicketRevenue({
      totalReceipts: 100_000,
      participatingGroupCount: 4,
      groupNominatedAdmissions: 0,
      allNominatedAdmissions: 0,
    })).toBe(3_750);
  });
});

describe.each([3, 5, 9, 15] as const)("%i-member prologue route", (rosterSize) => {
  it("runs from mandatory interview to TIF without double-settling a live", () => {
    let state = createPrologueState({ saveId: `route-${rosterSize}`, difficulty: "normal" });
    state = completeMandatoryInterview(state);
    expect(state.interviewedCandidateIds).toHaveLength(15);
    state = spendInterviewAp(state, 6);
    state = signRoster(state, routeCandidateIds(rosterSize));
    expect(state.members.filter((member) => member.active)).toHaveLength(rosterSize);
    expect(isOctoberSmallGroupAugmentationEligible(state)).toBe(rosterSize <= 5);
    state = completeStrategyAndOriginals(state);
    const cashBeforeDebut = state.finance.cash;

    state = resolveLive({
      state: offer(state, "debut-2013-05-24"),
      eventId: "debut-2013-05-24",
      chekiSales: [{ memberId: state.members[0].id, tierId: "1000", units: 1 }],
    });
    // The special debut contract permits every signed member. Ticket revenue
    // and venue rent are absent unless an explicit event contract posts them.
    expect(state.events.find((event) => event.id === "debut-2013-05-24")?.participantIds).toHaveLength(rosterSize);
    expect(state.finance.cash).toBe(cashBeforeDebut + 800);
    const onceSettled = state;
    // A replay cannot post another ledger entry; a second offer is also
    // rejected by the explicit event lifecycle.
    expect(resolveLive({ state, eventId: "debut-2013-05-24" })).toBe(onceSettled);
    expect(() => offer(state, "debut-2013-05-24")).toThrow("not dormant");
    expect(state).toBe(onceSettled);

    state = resolveLive({ state: offer(state, "experimental-2014-01-15"), eventId: "experimental-2014-01-15" });
    state = resolveLive({ state: offer(state, "regular-2014-03-05"), eventId: "regular-2014-03-05" });
    state = resolveLive({ state: offer(state, "graduation-announcement-2014-04-16"), eventId: "graduation-announcement-2014-04-16" });
    state = resolveLive({ state: offer(state, "graduation-2014-05-11"), eventId: "graduation-2014-05-11" });
    state = graduateRina(state);
    state = resolveLive({ state: offer(state, "one-man-2014-07-27"), eventId: "one-man-2014-07-27" });
    state = resolveLive({ state: offer(state, "tif-2014-08-02"), eventId: "tif-2014-08-02" });
    expect(state.gates.G11).toBe(true);
    expect(state.members.find((member) => member.id === "IPC1-001")?.active).toBe(false);
    expect(state.weeklyReviewHosts.at(-1)?.memberId).not.toBe("IPC1-001");
    expect(state.finance.cash).toBe(cashBeforeDebut + 800);
  });
});

describe("schedule integrity", () => {
  it("has four experimental events, no December regular, one 4/16 live, and both 6/25 + 6/26", () => {
    const schedule = createPrologueSchedule();
    expect(schedule.filter((event) => event.kind === "experimental-regular")).toHaveLength(4);
    expect(schedule.filter((event) => event.date === "2014-04-16")).toHaveLength(1);
    expect(schedule.some((event) => event.id === "regular-2014-06-25")).toBe(true);
    expect(schedule.some((event) => event.id === "taiban-2014-06-26")).toBe(true);
    expect(schedule.some((event) => event.date.startsWith("2013-12") && event.kind === "regular")).toBe(false);
  });

  it("keeps loans distinct from operating revenue", () => {
    const finance = postLedgerEntry({
      cash: 1_000, operatingRevenue: 0, operatingCost: 0, capitalizedAssets: 0, loans: 0, entries: [],
    }, {
      id: "loan", date: "2013-01-07", kind: "loan_proceeds", amount: 500,
      category: "loan", note: "Bridge loan",
    });
    expect(finance).toMatchObject({ cash: 1_500, loans: 500, operatingRevenue: 0 });
  });
});

describe("prologue founder fan seed", () => {
  it("maps the historical founder asset once into O and member affinity", () => {
    const state = createPrologueState({ saveId: "founder-fan-seed" });
    expect(state.fan.publicCount).toBe(240);
    expect(state.fan.otakuCount).toBe(30);
    expect(state.fan.temporarilyUnassignedOtaku).toBe(0);
    expect(state.fan.members["IPC1-001"]).toEqual({ affinityCount: 20, purchaseWeightKJPY: 1.8 });
    expect(state.fan.members["IPC1-002"]).toEqual({ affinityCount: 10, purchaseWeightKJPY: 1.8 });
    expect(state.fan.members["IPC1-003"]).toEqual({ affinityCount: 0, purchaseWeightKJPY: 0 });
    expect(prologueFounderFanSeedV1.otakuCount).toBe(30);
  });

  it("preserves the founder seed while signing newcomers without copying it", () => {
    const opened = completeMandatoryInterview(createPrologueState({ saveId: "founder-fan-sign" }));
    const signed = signRoster(opened, routeCandidateIds(9));
    expect(signed.fan.otakuCount).toBe(30);
    expect(signed.fan.members["IPC1-001"].affinityCount).toBe(20);
    expect(signed.fan.members["IPC1-002"].affinityCount).toBe(10);
    for (const memberId of routeCandidateIds(9)) {
      expect(signed.fan.members[memberId]).toEqual({ affinityCount: 0, purchaseWeightKJPY: 0 });
    }
  });
});

describe("daily advancement and recovery", () => {
  it("stops on a blocking opening gate, posts shared training/payroll, and emits a ledger-led month report", () => {
    const blocked = advanceWithStaff(createPrologueState({ saveId: "blocked", difficulty: "normal" }));
    expect(blocked).toMatchObject({ advancedDays: 0, blockingGate: "G01" });

    let state = startTestRoute(createPrologueState({ saveId: "daily", difficulty: "normal" }), 5);
    while (state.date < "2013-02-01") {
      const result = advanceWithStaff(state);
      expect(result.awaitingSettlementEventId).toBeUndefined();
      state = result.state;
    }
    expect(state.monthlyReports.map((report) => report.month)).toContain("2013-01");
    expect(state.finance.entries.some((entry) => entry.category === "training_room")).toBe(true);
    expect(state.finance.entries.some((entry) => entry.category === "member_payroll")).toBe(true);
  });

  it("persists and restores a complete save snapshot", async () => {
    const reset = await resetLocalSave();
    const progressed = startTestRoute(reset, 9);
    await savePrologueState(progressed);
    const restored = await loadOrCreateSave();
    expect(restored).toEqual(progressed);
  });
});
