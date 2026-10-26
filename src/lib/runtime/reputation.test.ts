import { describe, expect, it } from "vitest";
import { applyBrandEvent, createReputationState, reputationIntegratedV1, reputationTier, scoreLiveReputation, scoreMusicReputation, settleWeeklyReputation } from "./reputation";

describe("Fan Reputation Integrated v1", () => {
  it("uses the v1 tier boundaries and preserves unavailable dimensions", () => {
    expect(reputationTier(799)).toBe("E+");
    expect(reputationTier(800)).toBe("D-");
    expect(reputationTier(10_000)).toBe("S");
    const state = createReputationState();
    const settled = settleWeeklyReputation({ state, weekEnd: "2013-05-26", debutDate: "2013-05-24", live: null, music: null });
    expect(settled.live).toBeNull();
    expect(settled.music).toBeNull();
    expect(settled.visibleToPlayer).toBe(true);
    expect(settled.current).toBe(reputationIntegratedV1.prior);
  });

  it("records Brand events idempotently and applies their gain after weekly decay", () => {
    const opening = createReputationState();
    const announced = applyBrandEvent({ state: opening, eventId: "tif:announcement", gain: 126 });
    expect(applyBrandEvent({ state: announced, eventId: "tif:announcement", gain: 126 })).toEqual(announced);
    const settled = settleWeeklyReputation({ state: announced, weekEnd: "2014-05-04", debutDate: "2013-05-24", live: null, music: null });
    expect(settled.brand).toBeCloseTo(opening.brand * reputationIntegratedV1.weeklyBrandRetention + 126);
    expect(settled.pendingBrandGains).toBe(0);
    expect(settleWeeklyReputation({ state: settled, weekEnd: "2014-05-04", debutDate: "2013-05-24", live: null, music: null })).toEqual(settled);
  });

  it("maps actual Live and original-reception evidence to finite continuous scores", () => {
    expect(scoreLiveReputation({ ticketGrossJPY: 2_000_000, averageActualAttendance: 100, attributableShowCount: 20 })).toBe(1100);
    expect(scoreLiveReputation({ ticketGrossJPY: 2_000_000, averageActualAttendance: 10, attributableShowCount: 20 })).toBe(799);
    expect(scoreMusicReputation({ publishedOriginalCount: 2, meanReceptionQuality: 0.6 })).toBe(1062);
    expect(scoreMusicReputation({ publishedOriginalCount: 0, meanReceptionQuality: null })).toBeNull();
  });
});
