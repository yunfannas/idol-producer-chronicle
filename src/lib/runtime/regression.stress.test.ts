import { describe, expect, it } from "vitest";
import { runTwelveWeekRoute, settleChekiQueue, type ChekiServiceRecord } from "./regression";
import type { FanState } from "./types";

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const total = (sales: ReturnType<typeof settleChekiQueue>, field: "requestedJPY" | "grossJPY" | "queueLostJPY") =>
  Object.values(sales).reduce((sum, item) => sum + item[field], 0);

function state(otaku: number, profiles: Record<string, { affinityCount: number; purchaseWeightKJPY: number }>): FanState {
  return { publicCount: 300, otakuCount: otaku, temporarilyUnassignedOtaku: 0, members: profiles };
}

describe("B/C/D stress fixtures — not historical or production Scenario seeds", () => {
  it("B: a popular member saturates the 60-minute queue; unmet demand is not revenue", () => {
    const fan = state(300, { star: { affinityCount: 240, purchaseWeightKJPY: 15 } });
    const traces: ChekiServiceRecord[] = [];
    const sales = settleChekiQueue({
      fan, memberIds: ["star"], attendeeOtaku: 250, seed: "B:hot-member:1",
      onService: (record) => traces.push(record),
    });
    expect(sales.star.requestedJPY).toBeGreaterThan(sales.star.grossJPY);
    expect(sales.star.queueLostJPY).toBeGreaterThan(0);
    expect(sales.star.completedUnits).toBeLessThan(sales.star.requestedUnits);
    expect(traces.every((record) => record.endSeconds <= 3600)).toBe(true);
    expect(total(sales, "grossJPY")).toBeLessThanOrEqual(total(sales, "requestedJPY"));
    expect(settleChekiQueue({ fan, memberIds: ["star"], attendeeOtaku: 250, seed: "B:hot-member:1" })).toEqual(sales);
  });

  it("C: ΣA>O supports multi-oshi purchases but a fan never serves two members simultaneously", () => {
    const members = ["a", "b", "c", "d", "e"];
    const fan = state(300, Object.fromEntries(members.map((id) => [id, {
      affinityCount: 120, purchaseWeightKJPY: 2,
    }])));
    const traces: ChekiServiceRecord[] = [];
    const sales = settleChekiQueue({
      fan, memberIds: members, attendeeOtaku: 150, seed: "C:multi-oshi:1",
      onService: (record) => traces.push(record),
    });
    expect(members.reduce((sum, id) => sum + fan.members[id].affinityCount, 0)).toBeGreaterThan(fan.otakuCount);
    expect(traces.length).toBeGreaterThan(0);
    const byFan = new Map<string, ChekiServiceRecord[]>();
    for (const record of traces) {
      const records = byFan.get(record.fanId) ?? [];
      records.push(record);
      byFan.set(record.fanId, records);
    }
    expect([...byFan.values()].some((records) => new Set(records.map((record) => record.memberId)).size > 1)).toBe(true);
    for (const records of byFan.values()) {
      records.sort((left, right) => left.startSeconds - right.startSeconds);
      for (let index = 1; index < records.length; index += 1) {
        expect(records[index].startSeconds).toBeGreaterThanOrEqual(records[index - 1].endSeconds);
      }
    }
    for (const member of members) {
      expect(sales[member].grossJPY).toBeLessThanOrEqual(sales[member].requestedJPY);
    }
    expect(settleChekiQueue({ fan, memberIds: members, attendeeOtaku: 150, seed: "C:multi-oshi:1" })).toEqual(sales);
  });

  it("D: stronger live exposure and actual interaction improve O, A and W over 12 weeks", () => {
    const neutral = Array.from({ length: 20 }, (_, seed) => runTwelveWeekRoute(9, seed + 1));
    const growing = Array.from({ length: 20 }, (_, seed) => runTwelveWeekRoute(9, seed + 1, {
      liveQualityFactor: 1.5,
      interactionQualityBonus: 0.5,
      externalWatchingAudience: 120,
    }));
    const final = (routes: typeof neutral, field: "otakuCount" | "affinityTotal" | "purchaseWeightMean") =>
      mean(routes.map((route) => route.weeks[11][field]));
    expect(final(growing, "otakuCount")).toBeGreaterThan(final(neutral, "otakuCount"));
    expect(final(growing, "affinityTotal")).toBeGreaterThan(final(neutral, "affinityTotal"));
    expect(final(growing, "purchaseWeightMean")).toBeGreaterThan(final(neutral, "purchaseWeightMean"));
    expect(runTwelveWeekRoute(9, 7, {
      liveQualityFactor: 1.5, interactionQualityBonus: 0.5, externalWatchingAudience: 120,
    })).toEqual(runTwelveWeekRoute(9, 7, {
      liveQualityFactor: 1.5, interactionQualityBonus: 0.5, externalWatchingAudience: 120,
    }));
    console.info(`STRESS_D_SUMMARY ${JSON.stringify({
      neutral: {
        O: final(neutral, "otakuCount"), A: final(neutral, "affinityTotal"),
        W: final(neutral, "purchaseWeightMean"),
      },
      growth: {
        O: final(growing, "otakuCount"), A: final(growing, "affinityTotal"),
        W: final(growing, "purchaseWeightMean"),
      },
    })}`);
  });
});
