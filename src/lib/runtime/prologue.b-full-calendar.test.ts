import { describe, expect, it } from "vitest";
import {
  completeMandatoryInterview, completeStrategyAndOriginals,
  createPrologueState, graduateRina, isOctoberSmallGroupAugmentationEligible,
  markEventEligible, offerEligibleEvent, resolveLive, signRoster,
} from "./prologue";

/**
 * Gate-only B-route integration: this is NOT a full Staff/Fan/Performance
 * economic simulation. No arbitrary Cheki sales, audience or ticket income
 * is injected to force a favorable result.
 */
describe("B-route chronological event replay through TIF", () => {
  it("can resolve every existing scheduled event once without a chapter softlock", () => {
    const six = ["IPC1-004", "IPC1-005", "IPC1-006", "IPC1-007", "IPC1-008", "IPC1-009"];
    let state = createPrologueState({ saveId: "staff-b-through-tif" });
    state = signRoster(completeMandatoryInterview(state), six);
    state = completeStrategyAndOriginals(state);
    expect(state.members.filter((member) => member.active)).toHaveLength(9);
    expect(isOctoberSmallGroupAugmentationEligible(state)).toBe(false);

    const ordered = [...state.events].sort((a, b) =>
      a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    );
    const settledDates: string[] = [];
    let graduated = false;
    for (const scheduled of ordered) {
      if (scheduled.date >= "2013-10-01" && scheduled.date < "2013-11-01") {
        expect(isOctoberSmallGroupAugmentationEligible(state)).toBe(false);
      }
      state = markEventEligible(state, scheduled.id);
      state = offerEligibleEvent(state, scheduled.id);
      const activeBefore = state.members.filter((member) => member.active).map((member) => member.id);
      const once = resolveLive({ state, eventId: scheduled.id });
      const replay = resolveLive({ state: once, eventId: scheduled.id });
      expect(replay).toBe(once);
      const savedEvent = once.events.find((event) => event.id === scheduled.id);
      expect(savedEvent?.status).toBe("RESOLVED");
      expect(savedEvent?.participantIds).toEqual(activeBefore);
      if (graduated) expect(savedEvent?.participantIds).not.toContain("IPC1-001");
      state = replay;
      settledDates.push(scheduled.date);

      if (scheduled.id === "graduation-2014-05-11") {
        state = graduateRina(state);
        graduated = true;
        expect(state.members.filter((member) => member.active)).toHaveLength(8);
        expect(state.weeklyReviewHosts.at(-1)?.memberId).not.toBe("IPC1-001");
      }
    }
    const regularDates = state.events.filter((event) => event.kind === "regular").map((event) => event.date);
    expect(regularDates).toHaveLength(22);
    expect(regularDates.filter((date) => date === "2014-04-16")).toHaveLength(1);
    expect(state.events.filter((event) => event.status === "RESOLVED")).toHaveLength(state.events.length);
    expect(state.resolvedEventKeys).toHaveLength(state.events.length);
    expect(new Set(state.resolvedEventKeys).size).toBe(state.events.length);
    expect(settledDates.at(-1)).toBe("2014-08-02");
    expect(state.gates.G11).toBe(true);

    // Assets were paid once; this test intentionally has no Fan/Live income.
    expect(state.finance.capitalizedAssets).toBe(615_000);
    expect(state.finance.cash).toBe(2_385_000);
    expect(state.finance.operatingRevenue).toBe(0);
  });
});
