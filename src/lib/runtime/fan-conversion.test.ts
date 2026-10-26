import { describe, expect, it } from "vitest";
import {
  chekiConversionProbability,
  chekiInteractionSatisfaction,
  memberLiveConversionProbability,
  newcomerVoucherParticipationProbability,
  teamLiveConversionProbability,
} from "./fan-conversion";

describe("R0 dynamic fan conversion", () => {
  it("responds to actual Team and Member performance instead of a fixed active-P rate", () => {
    expect(teamLiveConversionProbability(0.9, "active-public")).toBeGreaterThan(teamLiveConversionProbability(0.1, "active-public"));
    expect(memberLiveConversionProbability(0.9, "active-public")).toBeGreaterThan(memberLiveConversionProbability(0.1, "active-public"));
    expect(teamLiveConversionProbability(0.7, "external-idol")).toBeGreaterThan(teamLiveConversionProbability(0.7, "external-general"));
  });

  it("requires a completed interaction input and gives member-source vouchers their specified participation share", () => {
    const promptInteraction = chekiInteractionSatisfaction(0.8, 0);
    const delayedInteraction = chekiInteractionSatisfaction(0.8, 60);
    expect(chekiConversionProbability(promptInteraction, "member", "active-public")).toBeGreaterThan(chekiConversionProbability(delayedInteraction, "member", "active-public"));
    expect(newcomerVoucherParticipationProbability("team")).toBe(0.3);
    expect(newcomerVoucherParticipationProbability("member")).toBe(0.5);
  });
});
