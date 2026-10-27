import { describe, expect, it } from "vitest";
import {
  addMemberInterest,
  applyCompletedBroadTokutenConversions,
  consumeInterestProportionally,
  settleWeeklyInterest,
  totalInterest,
} from "./fan-interest";
import { createFanState, ensureFanMembers } from "./fan";

describe("v1.5 four-week Interest state", () => {
  it("initializes follower and Interest state without creating fan population", () => {
    const fan = createFanState(["a"], { publicCount: 20, otakuCount: 10 });
    expect(fan.followers).toEqual({ team: 0, members: { a: 0 } });
    expect(fan.interests.a).toEqual({ public: [0, 0, 0, 0], otaku: [0, 0, 0, 0] });
    expect(fan.publicCount).toBe(20);
    expect(fan.otakuCount).toBe(10);
  });

  it("adds new Interest only to the newest slot and redeems successful service proportionally", () => {
    let fan = createFanState(["a"], { publicCount: 100, otakuCount: 30 });
    fan = addMemberInterest(fan, { memberId: "a", source: "public", amount: 10 });
    expect(fan.interests.a.public).toEqual([0, 0, 0, 10]);
    expect(consumeInterestProportionally([4, 3, 2, 1], 5)).toEqual([2, 1.5, 1, 0.5]);
  });

  it("expires/renews once weekly and does not immediately expire new Interest", () => {
    const fan = createFanState(["a"], { publicCount: 200, otakuCount: 100 });
    fan.interests.a.public = [10, 20, 30, 40];
    const settled = settleWeeklyInterest(fan, {
      renewalFractions: { a: { public: 0.5 } },
      newInterest: { a: { public: 5 } },
    });
    expect(settled.fan.interests.a.public).toEqual([20, 30, 40, 10]);
    expect(settled.audit.a.public).toMatchObject({ expired: 10, renewed: 5, lost: 5, added: 5 });
  });

  it("does not clip an event-local Interest snapshot until weekly reconciliation", () => {
    let fan = createFanState(["a"], { publicCount: 1, otakuCount: 0 });
    fan = addMemberInterest(fan, { memberId: "a", source: "public", amount: 10 });
    expect(totalInterest(fan.interests.a.public)).toBe(10);
    const settled = settleWeeklyInterest(fan);
    expect(totalInterest(settled.fan.interests.a.public)).toBe(1);
    expect(settled.audit.a.public.populationClipped).toBe(9);
  });

  it("creates P→O/A only from successful completed broad-tokuten services", () => {
    let fan = createFanState(["a", "b"], { publicCount: 5, otakuCount: 0 });
    fan = addMemberInterest(fan, { memberId: "a", source: "public", amount: 1 });
    fan = addMemberInterest(fan, { memberId: "b", source: "public", amount: 1 });
    const noService = applyCompletedBroadTokutenConversions({ fan, services: [{ memberId: "a", source: "public", completedServices: 0, successfulRelationships: 1 }] });
    expect(noService.fan).toEqual(fan);

    const converted = applyCompletedBroadTokutenConversions({
      fan,
      services: [
        { memberId: "a", source: "public", completedServices: 1, successfulRelationships: 1 },
        { memberId: "b", source: "public", completedServices: 1, successfulRelationships: 1 },
      ],
      estimatedDistinctPublicServed: 1,
    });
    expect(converted.audit.newOtaku).toBe(1);
    expect(converted.fan).toMatchObject({ publicCount: 4, otakuCount: 1 });
    expect(converted.fan.members.a.affinityCount + converted.fan.members.b.affinityCount).toBe(2);
    expect(converted.fan.members.a.affinityCount).toBeLessThanOrEqual(converted.fan.otakuCount);
    expect(converted.fan.members.b.affinityCount).toBeLessThanOrEqual(converted.fan.otakuCount);
  });

  it("extends roster persistence without assigning historical followers or interests", () => {
    const extended = ensureFanMembers(createFanState(["a"]), ["b"]);
    expect(extended.members.b).toEqual({ affinityCount: 0, purchaseWeightKJPY: 0 });
    expect(extended.followers.members.b).toBe(0);
    expect(extended.interests.b).toEqual({ public: [0, 0, 0, 0], otaku: [0, 0, 0, 0] });
  });
});
