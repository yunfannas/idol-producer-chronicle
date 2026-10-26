import { describe, expect, it } from "vitest";
import {
  completeMandatoryInterview,
  createPrologueSchedule,
  createPrologueState,
  signRoster,
} from "./prologue";

const founders = ["IPC1-001", "IPC1-002", "IPC1-003"];
const firstSix = ["IPC1-004", "IPC1-005", "IPC1-006", "IPC1-007", "IPC1-008", "IPC1-009"];

function routeB() {
  return signRoster(completeMandatoryInterview(createPrologueState({ saveId: "B-default" })), firstSix);
}

describe("Chronicle B Staff-only deterministic entry checks", () => {
  it("has one initial budget, regardless of legacy difficulty argument", () => {
    for (const difficulty of ["easy", "normal", "hard"] as const) {
      const state = createPrologueState({ saveId: "one-budget", difficulty });
      expect(state.finance.cash).toBe(3_000_000);
      expect(state.difficulty).toBe("normal");
    }
  });

  it("keeps the approved founder Fan seed through the B recruitment decision", () => {
    const opening = createPrologueState({ saveId: "founder-seed-240" });
    const signed = signRoster(completeMandatoryInterview(opening), firstSix);
    for (const fan of [opening.fan, signed.fan]) {
      expect(fan.publicCount).toBe(240);
      expect(fan.otakuCount).toBe(30);
      expect(fan.members["IPC1-001"].affinityCount).toBe(20);
      expect(fan.members["IPC1-002"].affinityCount).toBe(10);
    }
    expect(firstSix.every((id) => signed.fan.members[id].affinityCount === 0)).toBe(true);
  });

  it("starts with 9 members, 3 skilled founders and 6 zero-palette newcomers", () => {
    const state = routeB();
    expect(state.members).toHaveLength(9);
    const byId = Object.fromEntries(state.members.map((member) => [member.id, member]));
    expect(byId[founders[0]].developedPalette?.pink).toBe(10);
    expect(byId[founders[1]].developedPalette?.red).toBe(5);
    expect(byId[founders[2]].developedPalette?.yellow).toBe(5);
    for (const id of firstSix) {
      expect(Object.values(byId[id].developedPalette ?? {})).toHaveLength(8);
      expect(Object.values(byId[id].developedPalette ?? {}).every((value) => value === 0)).toBe(true);
    }
  });

  it("offers the four trials, 22 nonduplicated Wednesday regulars and TIF", () => {
    const events = createPrologueSchedule();
    expect(events.filter((e) => e.kind === "experimental-regular")).toHaveLength(4);
    const regular = events.filter((e) => e.kind === "regular");
    expect(regular).toHaveLength(22);
    expect(new Set(regular.map((e) => e.date)).size).toBe(22);
    expect(regular.filter((e) => e.date === "2014-04-16")).toHaveLength(1);
    expect(events.filter((e) => e.id === "tif-2014-08-02")).toHaveLength(1);
    expect(events.filter((e) => e.id === "one-man-2014-07-27")).toHaveLength(1);
  });
});
