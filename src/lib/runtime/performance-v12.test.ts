import { describe, expect, it } from "vitest";
import type { Color8, SongPalette } from "./types";
import {
  abilityBaseV12,
  applySongImpressionV12,
  difficultyPenaltyV12,
  failureProbabilityV12,
  resolveSongEnvironmentV12,
  resolveSongPerformanceV12,
  songAppealV12,
} from "./performance-v12";

const palette = (value = 0): SongPalette => ({ red: value, orange: value, yellow: value, green: value, aqua: value, blue: value, purple: value, pink: value });
const neutralPalette = () => palette(1 / 8);
const member = (id: string, overrides: Partial<Parameters<typeof resolveSongPerformanceV12>[0]["performers"][number]> = {}) => ({
  id,
  condition: 100,
  attributes: { breath: 12, rhythm: 12, power: 12, pitch: 12, tone: 10, agility: 12, stagePresence: 10 },
  ...overrides,
});

function song(parts: Parameters<typeof resolveSongPerformanceV12>[0]["parts"], performers = [member("A"), member("B"), member("C")]): Parameters<typeof resolveSongPerformanceV12>[0] {
  return {
    seed: "performance-v12-test",
    liveId: "live",
    songId: "song",
    arrangementVersion: "v1",
    vocalDifficulty: 12,
    danceDifficulty: 12,
    paletteExpressionMultiplier: 1,
    performers,
    parts,
  };
}

describe("Technical Performance v1.2", () => {
  it("uses the approved continuous technical curve and Song Appeal anchors", () => {
    expect(abilityBaseV12(20) / abilityBaseV12(8)).toBeCloseTo(2, 10);
    expect(difficultyPenaltyV12(20, 18)).toBe(1);
    expect(difficultyPenaltyV12(8, 18)).toBeLessThan(difficultyPenaltyV12(8, 8));
    expect(songAppealV12(8, 8)).toBe(53);
    expect(songAppealV12(12, 12)).toBe(67);
    expect(songAppealV12(18, 18)).toBe(91);
    expect(failureProbabilityV12(0)).toBeCloseTo(0.0474, 3);
    expect(failureProbabilityV12(-2)).toBeCloseTo(0.1824, 3);
  });

  it("uses actual relay seconds, conserves credit, and never creates a singer by fallback", () => {
    const result = resolveSongPerformanceV12({ ...song([{
      id: "relay", order: 0, durationSec: 25, exposure: 1, mode: "relay",
      relaySlices: [
        { singerMemberId: "A", startSec: 0, endSec: 5 },
        { singerMemberId: "B", startSec: 5, endSec: 20 },
        { singerMemberId: "C", startSec: 20, endSec: 25 },
      ],
      dancerIds: [],
    }], [member("A"), member("B"), member("C")]), forcedFailures: { "A:vocal:primary": false, "B:vocal:primary": false, "C:vocal:primary": false } });
    const part = result.parts[0];
    expect(part.memberPerfById.B / part.memberPerfById.A).toBeCloseTo(3, 10);
    expect(part.memberPerfById.C).toBeCloseTo(part.memberPerfById.A, 10);
    expect(Object.values(part.memberPerfById).reduce((sum, value) => sum + value, 0)).toBeCloseTo(part.teamPerf, 10);
  });

  it("keeps unison TeamPerf independent of lineup size and isolates a singer's error", () => {
    const resolveUnison = (count: number, failed = false) => {
      const performers = Array.from({ length: count }, (_, index) => member(`M${index}`));
      return resolveSongPerformanceV12({
        ...song([{ id: "sabi", order: 0, durationSec: 30, exposure: 1, mode: "unison", unisonSingerIds: performers.map((performer) => performer.id), dancerIds: [] }], performers),
        forcedFailures: { ...Object.fromEntries(performers.map((performer) => [`${performer.id}:vocal:primary`, false])), ...(failed ? { "M0:vocal:primary": true } : {}) },
      });
    };
    const three = resolveUnison(3);
    const nine = resolveUnison(9);
    expect(three.teamPerf).toBeCloseTo(nine.teamPerf, 10);
    const clean = resolveUnison(9);
    const failed = resolveUnison(9, true);
    expect(failed.memberPerfById.M0).toBeLessThan(clean.memberPerfById.M0);
    expect(failed.memberPerfById.M1).toBeCloseTo(clean.memberPerfById.M1, 10);
    expect(clean.teamPerf - failed.teamPerf).toBeCloseTo((clean.memberPerfById.M0 - failed.memberPerfById.M0), 10);
  });

  it("targets the default Ochi lead with an independent, local extra Pitch check", () => {
    const result = resolveSongPerformanceV12({
      ...song([{ id: "ochi_sabi", order: 0, durationSec: 20, exposure: 1, mode: "relay", relaySlices: [{ singerMemberId: "A", startSec: 0, endSec: 20 }], dancerIds: ["A", "B"] }], [member("A"), member("B")]),
      forcedFailures: { "A:vocal:primary": false, "A:vocal:ochi_extra": true, "B:dance:primary": false, "A:dance:primary": false },
    });
    expect(result.failures).toMatchObject([{ memberId: "A", partId: "ochi_sabi", checkScope: "ochi_extra", ordinalInSongPath: 1 }]);
    const executionA = result.memberPartExecutions.find((execution) => execution.memberId === "A")!;
    const executionB = result.memberPartExecutions.find((execution) => execution.memberId === "B")!;
    expect(executionA.vocalExecution).toBeLessThan(1);
    expect(executionB.danceExecution).toBeGreaterThan(0);
  });
});

describe("Performance → Impression v1.0", () => {
  const all = (value: number) => Object.fromEntries((["red", "orange", "yellow", "green", "aqua", "blue", "purple", "pink"] as Color8[]).map((color) => [color, value])) as Record<Color8, number>;

  it("reads environment after Performance, with neutral and W80 anchors", () => {
    const neutral = resolveSongEnvironmentV12({ worldPopularity: all(40), liveSaturation: all(0), teamColor: neutralPalette(), songPalette: neutralPalette() });
    expect(neutral.songEnvironment).toEqual({ public: 1, otaku: 1 });
    const red = palette(); red.red = 1;
    const popular = resolveSongEnvironmentV12({ worldPopularity: all(80), liveSaturation: all(0), teamColor: neutralPalette(), songPalette: red });
    expect(popular.songEnvironment.public).toBeCloseTo(1.2, 10);
    expect(popular.songEnvironment.otaku).toBeCloseTo(1.1, 10);
  });

  it("uses pre-song LiveSat and only penalizes the third repeated pure-color song", () => {
    const red = palette(); red.red = 1;
    const world = all(40);
    const team = neutralPalette();
    const first = resolveSongEnvironmentV12({ worldPopularity: world, liveSaturation: all(0), teamColor: team, songPalette: red });
    const second = resolveSongEnvironmentV12({ worldPopularity: world, liveSaturation: first.nextLiveSaturation, teamColor: team, songPalette: red });
    const third = resolveSongEnvironmentV12({ worldPopularity: world, liveSaturation: second.nextLiveSaturation, teamColor: team, songPalette: red });
    expect(first.nextLiveSaturation.red).toBeCloseTo(50, 10);
    expect(second.nextLiveSaturation.red).toBeCloseTo(85, 10);
    expect(first.songEnvironment.public).toBe(1);
    expect(second.songEnvironment.public).toBe(1);
    expect(third.songEnvironment.public).toBeLessThan(1);
  });

  it("applies the audience environment once without changing stored Performance", () => {
    const performance = resolveSongPerformanceV12({ ...song([{ id: "solo", order: 0, durationSec: 20, exposure: 1, mode: "relay", relaySlices: [{ singerMemberId: "A", startSec: 0, endSec: 20 }], dancerIds: [] }], [member("A")]), forcedFailures: { "A:vocal:primary": false } });
    const neutral = resolveSongEnvironmentV12({ worldPopularity: all(40), liveSaturation: all(0), teamColor: neutralPalette(), songPalette: neutralPalette() });
    const popular = resolveSongEnvironmentV12({ worldPopularity: all(80), liveSaturation: all(0), teamColor: neutralPalette(), songPalette: neutralPalette() });
    expect(applySongImpressionV12(performance, popular).teamImpression.public).toBeGreaterThan(applySongImpressionV12(performance, neutral).teamImpression.public);
    expect(performance.teamPerf).toBeGreaterThan(0);
  });
});
