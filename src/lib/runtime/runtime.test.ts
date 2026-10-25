import { describe, expect, it } from "vitest";
import { DEFAULT_CHEKI_TIERS, settleChekiSales } from "./cheki";
import { calculateTaibanTicketRevenue, postLedgerEntry } from "./finance";
import { applyActivityLoad, conditionAmplifier, liveSongGeneralLoad } from "./performance";
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
  routeCandidateIds,
  signRoster,
  spendInterviewAp,
} from "./prologue";
import type { RuntimeEvent, RuntimeMember } from "./types";

function offer(state: ReturnType<typeof createPrologueState>, eventId: string) {
  return offerEligibleEvent(markEventEligible(state, eventId), eventId);
}

describe("Chronicle parent-runtime contracts", () => {
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

    state = resolveLive({
      state: offer(state, "debut-2013-05-24"),
      eventId: "debut-2013-05-24",
      chekiSales: [{ memberId: state.members[0].id, tierId: "1000", units: 1 }],
    });
    // The special debut contract permits every signed member. Ticket revenue
    // and venue rent are absent unless an explicit event contract posts them.
    expect(state.events.find((event) => event.id === "debut-2013-05-24")?.participantIds).toHaveLength(rosterSize);
    expect(state.finance.cash).toBe(3_000_800);
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
    expect(state.finance.cash).toBe(3_000_800);
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
