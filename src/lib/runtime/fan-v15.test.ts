import { describe, expect, it } from "vitest";
import { createFanState } from "./fan";
import { addMemberInterest, totalInterest } from "./fan-interest";
import { resolveV15FanEvent, settleV15WeeklySns } from "./fan-v15";
import type { EventAudienceAttribution } from "./audience-channels";
import type { RuntimeEvent } from "./types";

const event: RuntimeEvent = {
  id: "v15-live", date: "2013-06-01", gate: "G05", kind: "taiban", status: "RESOLVED",
  scenarioInstance: "v15-live", chekiAllowed: true, participantIds: ["a"],
};

const attribution: EventAudienceAttribution = {
  ownedOtakuWatching: 0, ownedPublicWatching: 10, externalIdolWatching: 0, externalGeneralWatching: 0,
  activeIntentPublicWatching: 10, referredPublicWatching: 0, referredExternalWatching: 0,
  awarePublic: 10, publicDemand: 10, ticketedPublic: 10, configuredExternalDemand: 0,
  actualUniqueAudience: 10, activePublicToOtaku: 0, referredPublicToOtaku: 0, publicToOtaku: 0,
  externalIdolToOtaku: 0, externalGeneralToOtaku: 0, externalExposure: 0, externalToPublic: 0,
};

describe("v1.5 formal fan lifecycle", () => {
  it("creates only Interest at a Live with no Cheki service", () => {
    const result = resolveV15FanEvent({
      fan: createFanState(["a"], { publicCount: 100, otakuCount: 0 }),
      event: { ...event, chekiAllowed: false }, attribution: { ...attribution, ownedPublicWatching: 100, activeIntentPublicWatching: 100, awarePublic: 100, publicDemand: 100, ticketedPublic: 100, actualUniqueAudience: 100 }, memberIds: ["a"], quality: 1,
      exposure: { a: { exposureProbability: 1, quality: 1 } }, seed: "interest-only",
    });
    expect(result.fan.publicCount).toBe(100);
    expect(result.fan.otakuCount).toBe(0);
    expect(result.fan.members.a.affinityCount).toBe(0);
    expect(totalInterest(result.fan.interests.a.public)).toBeGreaterThan(0);
  });

  it("allows P→O/A only after a completed Interest-backed service", () => {
    let fan = createFanState(["a"], { publicCount: 10, otakuCount: 0 });
    fan = addMemberInterest(fan, { memberId: "a", source: "public", amount: 10 });
    const result = resolveV15FanEvent({
      fan, event, attribution, memberIds: ["a"], quality: 1,
      exposure: { a: { exposureProbability: 1, quality: 1 } }, seed: "completed-service",
    });
    expect(result.sales.a.paidNewcomerServed).toBeGreaterThan(0);
    expect(result.audit.newOtaku).toBeGreaterThan(0);
    expect(result.fan.otakuCount).toBe(result.audit.newOtaku);
    expect(result.fan.members.a.affinityCount).toBe(result.audit.newOtaku);
  });

  it("adds weekly SNS P once while creating Followers and aged Interest", () => {
    const result = settleV15WeeklySns({
      fan: createFanState(["a"], { publicCount: 10, otakuCount: 3 }), memberIds: ["a"],
      newPublic: 4, existingPublicReach: 100, hadLiveExposure: true, seed: "sns",
    });
    expect(result.fan.publicCount).toBe(14);
    expect(result.fan.followers.team).toBeGreaterThan(0);
    expect(result.fan.followers.members.a).toBeGreaterThan(0);
    expect(totalInterest(result.fan.interests.a.public)).toBeGreaterThan(0);
  });
});
