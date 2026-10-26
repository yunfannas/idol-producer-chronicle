import { describe, expect, it } from "vitest";
import { audienceChannelDiagnosticV1, resolveDiagnosticAudienceChannels } from "./audience-channels";

describe("C1–C3 diagnostic audience channels", () => {
  const input = {
    publicCount: 400,
    otakuCount: 40,
    capacity: 85,
    externalWatchingDemand: 20,
    otakuAttendanceRate: 0.12,
    quality: 1,
    seed: "audience-diagnostic-1",
  };

  it("uses the documented 50% awareness and 20% purchase candidates without filling empty seats", () => {
    const result = resolveDiagnosticAudienceChannels(input);
    expect(audienceChannelDiagnosticV1.publicAwarenessRate).toBe(0.5);
    expect(audienceChannelDiagnosticV1.publicBuyGivenAwareRate).toBe(0.2);
    expect(result.activeIntentPublicWatching).toBeGreaterThanOrEqual(0);
    expect(result.ticketedPublic).toBeLessThanOrEqual(result.publicDemand);
    expect(result.actualUniqueAudience).toBeLessThanOrEqual(input.capacity);
    const noDemand = resolveDiagnosticAudienceChannels({ ...input, capacity: 1_000, publicCount: 0, otakuCount: 0, externalWatchingDemand: 0, seed: "empty" });
    expect(noDemand.actualUniqueAudience).toBe(0);
  });

  it("deduplicates referred P from ordinary P demand and keeps the two external subtypes disjoint", () => {
    const result = resolveDiagnosticAudienceChannels({ ...input, otakuAttendanceRate: 1, seed: "friends-and-external" });
    expect(result.referredPublicWatching + result.activeIntentPublicWatching).toBe(result.publicDemand);
    expect(result.ownedPublicWatching).toBeLessThanOrEqual(input.publicCount);
    expect(result.externalIdolWatching + result.externalGeneralWatching).toBeLessThanOrEqual(input.capacity);
    expect(result.externalIdolToOtaku).toBeLessThanOrEqual(result.externalIdolWatching);
    expect(result.externalGeneralToOtaku).toBeLessThanOrEqual(result.externalGeneralWatching);
  });

  it("is deterministic and applies performance only to actual attendees", () => {
    const first = resolveDiagnosticAudienceChannels(input);
    expect(resolveDiagnosticAudienceChannels(input)).toEqual(first);
    const noAudience = resolveDiagnosticAudienceChannels({ ...input, publicCount: 0, otakuCount: 0, externalWatchingDemand: 0, seed: "none", quality: 1.5 });
    expect(noAudience.publicToOtaku + noAudience.externalIdolToOtaku + noAudience.externalGeneralToOtaku).toBe(0);
  });
});
