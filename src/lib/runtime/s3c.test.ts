import { describe, expect, it } from "vitest";
import {
  arrangementFor,
  createArrangementVersion,
  createPerformanceProgression,
  recordArrangementExposure,
  settleArrangementFamiliarityWeek,
} from "./arrangement-familiarity";
import { resolveKeyDuties } from "./key-duty";
import { emptyPalette, paletteExecutionBreakdown } from "./palette";

describe("S3-C arrangement familiarity", () => {
  it("settles maintenance before growth and makes exposure/week settlement idempotent", () => {
    let state = createPerformanceProgression({ songId: "song", arrangementVersion: "v1", initialFamiliarity: 50 });
    state = recordArrangementExposure({ state, songId: "song", arrangementVersion: "v1", sourceId: "rehearsal-1", rehearsalHours: 1 });
    const duplicate = recordArrangementExposure({ state, songId: "song", arrangementVersion: "v1", sourceId: "rehearsal-1", rehearsalHours: 1 });
    expect(arrangementFor(duplicate, "song", "v1").rehearsalHoursThisWeek).toBe(1);
    const settled = settleArrangementFamiliarityWeek({ state: duplicate, teamCoreAttributeAverage: 14, weekId: "week-1" });
    expect(settled.settlements[0]).toMatchObject({ decayDebt: 1, maintenancePaid: 1 });
    expect(settled.settlements[0].growth).toBeCloseTo(5 * (1 - 50 / 120));
    expect(settled.settlements[0].familiarityClose).toBeCloseTo(50 + 5 * (1 - 50 / 120));
    const replay = settleArrangementFamiliarityWeek({ state: settled.state, teamCoreAttributeAverage: 14, weekId: "week-1" });
    expect(replay.settlements).toEqual([]);
    expect(replay.state).toEqual(settled.state);
  });

  it("uses the prior week's real stage time to halve only the following decay debt", () => {
    let state = createPerformanceProgression({ songId: "song", arrangementVersion: "v1", initialFamiliarity: 50 });
    state = recordArrangementExposure({ state, songId: "song", arrangementVersion: "v1", sourceId: "live-1", stageHours: 1 });
    state = settleArrangementFamiliarityWeek({ state, teamCoreAttributeAverage: 14, weekId: "week-1" }).state;
    const next = settleArrangementFamiliarityWeek({ state, teamCoreAttributeAverage: 14, weekId: "week-2" });
    expect(next.settlements[0].decayDebt).toBeCloseTo(arrangementFor(state, "song", "v1").familiarity * 0.01);
  });

  it("decays without exposure and never grows when the maintenance payment is insufficient", () => {
    const noExposure = settleArrangementFamiliarityWeek({
      state: createPerformanceProgression({ songId: "song", arrangementVersion: "v1", initialFamiliarity: 50 }),
      teamCoreAttributeAverage: 14,
      weekId: "no-exposure",
    }).settlements[0];
    expect(noExposure).toMatchObject({ decayDebt: 1, maintenancePaid: 0, growth: 0, familiarityClose: 49 });

    let state = createPerformanceProgression({ songId: "song", arrangementVersion: "v1", initialFamiliarity: 50 });
    state = recordArrangementExposure({ state, songId: "song", arrangementVersion: "v1", sourceId: "short-rehearsal", rehearsalHours: 0.1 });
    const insufficient = settleArrangementFamiliarityWeek({ state, teamCoreAttributeAverage: 14, weekId: "insufficient" }).settlements[0];
    expect(insufficient).toMatchObject({ decayDebt: 1, growth: 0 });
    expect(insufficient.maintenancePaid).toBeCloseTo(0.6);
    expect(insufficient.familiarityClose).toBeCloseTo(49.6);
  });

  it("keeps a graduation arrangement separate and applies only its named inheritance", () => {
    const initial = createPerformanceProgression({ songId: "song", arrangementVersion: "v1", initialFamiliarity: 80 });
    const next = createArrangementVersion({ state: initial, songId: "song", fromArrangementVersion: "v1", arrangementVersion: "v2", inheritanceFactor: 0.5 });
    expect(arrangementFor(next, "song", "v1").familiarity).toBe(80);
    expect(arrangementFor(next, "song", "v2").familiarity).toBe(40);
  });
});

describe("S3-C key-duty resolver", () => {
  const assignment = [{ keyPartId: "bridge", partType: "bridge" as const, firstMemberId: "first", secondMemberId: "second", thirdMemberId: "third" }];
  const resolve = (lineupMemberIds: string[]) => resolveKeyDuties({
    liveId: "live", songId: "song", arrangementVersion: "v1", familiarityAtResolution: 40,
    assignments: assignment, lineupMemberIds, staffRankedMemberIds: ["staff", "second"],
  })[0];

  it("uses ordered explicit candidates before Staff and never changes the lineup", () => {
    expect(resolve(["first", "second", "third", "staff"])).toMatchObject({ selectedMemberId: "first", selectedFrom: "first" });
    expect(resolve(["second", "third", "staff"])).toMatchObject({ selectedMemberId: "second", selectedFrom: "second" });
    expect(resolve(["third", "staff"])).toMatchObject({ selectedMemberId: "third", selectedFrom: "third" });
    expect(resolve(["staff"])).toMatchObject({ selectedMemberId: "staff", selectedFrom: "staff" });
    expect(resolve([])).toMatchObject({ selectedMemberId: null, selectedFrom: "unfilled" });
  });

  it("preserves every legal key-part category and provides no implicit non-key part", () => {
    const partTypes = ["opening_sabi", "sabi_1_key_line", "sabi_2_key_line", "bridge", "ochi_sabi", "last_sabi"] as const;
    const duties = resolveKeyDuties({
      liveId: "live", songId: "song", arrangementVersion: "v1", familiarityAtResolution: 40,
      assignments: partTypes.map((partType) => ({ keyPartId: partType, partType, firstMemberId: "first" })),
      lineupMemberIds: ["first"], staffRankedMemberIds: [],
    });
    expect(duties.map((duty) => duty.partType)).toEqual(partTypes);
    expect(duties.every((duty) => duty.selectedFrom === "first" && duty.selectedMemberId === "first")).toBe(true);
  });

  it("passes only resolved key parts into the existing capped palette bonus", () => {
    const palette = { ...emptyPalette(100) };
    const song = { red: 1, pink: 0, orange: 0, aqua: 0, yellow: 0, green: 0, blue: 0, purple: 0 };
    const withoutDuties = paletteExecutionBreakdown({ song, participantPalettes: [palette], keyParts: [] });
    const withDuties = paletteExecutionBreakdown({
      song,
      participantPalettes: [palette],
      keyParts: Array.from({ length: 6 }, () => ({ maxBonus: 8, dutyPalette: palette, familiarity: 100 })),
    });
    expect(withoutDuties.keyBonus).toBe(0);
    expect(withDuties.keyBonus).toBeGreaterThan(0);
    expect(withDuties.keyBonus).toBeLessThanOrEqual(12);
  });
});
