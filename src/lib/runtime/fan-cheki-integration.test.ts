import { describe, expect, it } from "vitest";
import { applyWeeklyFanDecay, createFanState } from "./fan";
import { settleChekiQueue } from "./regression";
import { runStaffAutoplayPrologue } from "./staff-autoplay";

describe("Fan x Cheki integration audit invariants", () => {
  it("keeps Team-trigger O unassigned while Member/Cheki trigger A is path-accounted", () => {
    const result = runStaffAutoplayPrologue({
      route: "B", seed: 7, s3Variant: "S3-C", fanAcquisitionStage: "C3",
      newcomerVoucher: { enabled: true },
    });
    const total = (record: Record<string, number>) => Object.values(record).reduce((sum, value) => sum + value, 0);
    expect(result.events.some((event) => event.fanFlow.teamLiveToOtaku > 0)).toBe(true);
    for (const event of result.events) {
      expect(total(event.fanFlow.initialAffinityByMember)).toBe(
        total(event.fanFlow.memberLiveAffinityByMember)
        + total(event.fanFlow.paidChekiAffinityByMember)
        + total(event.fanFlow.voucherChekiAffinityByMember),
      );
    }
  });

  it("permits multi-oshi aggregate A to exceed O without normalizing it away", () => {
    const fan = createFanState(["a", "b"], { otakuCount: 10 });
    fan.members.a = { affinityCount: 10, purchaseWeightKJPY: 1.8 };
    fan.members.b = { affinityCount: 10, purchaseWeightKJPY: 1.8 };
    const decayed = applyWeeklyFanDecay(fan);
    expect(decayed.members.a.affinityCount + decayed.members.b.affinityCount).toBeGreaterThan(decayed.otakuCount);
    expect(decayed.members.a.affinityCount).toBeLessThanOrEqual(decayed.otakuCount);
    expect(decayed.members.b.affinityCount).toBeLessThanOrEqual(decayed.otakuCount);
  });

  it("keeps a congested single-member queue FIFO-only; it does not silently claim multi-oshi overflow", () => {
    const fan = createFanState(["hot", "other"], { otakuCount: 100 });
    fan.members.hot = { affinityCount: 100, purchaseWeightKJPY: 10 };
    const sales = settleChekiQueue({ fan, memberIds: ["hot", "other"], attendeeOtaku: 100, seed: "overflow-not-implemented" });
    expect(sales.hot.requestedJPY).toBeGreaterThan(0);
    expect(sales.other.requestedJPY).toBe(0);
    expect(sales.other.grossJPY).toBe(0);
    expect(sales.hot.queueLostJPY).toBeGreaterThan(0);
  });

  it("documents fixed natural retention until R2 supplies Live/SNS/satisfaction factors", () => {
    const fan = createFanState(["member"], { publicCount: 100, otakuCount: 100 });
    fan.members.member = { affinityCount: 50, purchaseWeightKJPY: 2 };
    const decayed = applyWeeklyFanDecay(fan);
    expect(decayed.publicCount).toBeCloseTo(99.6, 10);
    expect(decayed.otakuCount).toBeCloseTo(99.85, 10);
    expect(decayed.members.member.affinityCount).toBeCloseTo(50 * (1 - 0.0015) * (1 - 0.00075), 10);
  });
});
