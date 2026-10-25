import { describe, expect, it } from "vitest";
import { runOperatingSimulation } from "./operating-simulation";

describe("12-week Chronicle operating simulation v1", () => {
  it.each([5, 9, 15] as const)("runs a %i-member route through Staff, Live, Fan, Cheki and Finance", (rosterSize) => {
    const result = runOperatingSimulation(rosterSize, `operating:${rosterSize}:1`);
    expect(runOperatingSimulation(rosterSize, `operating:${rosterSize}:1`)).toEqual(result);
    expect(result.weeks).toHaveLength(12);
    expect(result.weeks.every((week) => week.quality >= 0.5 && week.quality <= 1.5)).toBe(true);
    expect(result.weeks.every((week) => week.meanCondition > 0 && week.meanCondition <= 100)).toBe(true);
    expect(result.members.some((member) => member.trainingExp > 0)).toBe(true);
    expect(result.finance.entries.some((entry) => entry.category === "training_room")).toBe(true);
    expect(result.finance.entries.some((entry) => entry.category === "member_payroll")).toBe(true);
    expect(result.finance.entries.some((entry) => entry.category === "cheki_sales")).toBe(true);
    expect(result.finance.entries.some((entry) => entry.category === "ticket_share")).toBe(true);
    const debut = result.weeks.find((week) => week.eventId === "debut-2013-05-24")!;
    const mall = result.weeks.find((week) => week.eventId === "mall-2013-09-29")!;
    expect(debut.ticketRevenueJPY).toBe(0);
    expect(mall.ticketRevenueJPY).toBe(0);
    expect(mall.chekiGrossJPY).toBe(0);
    console.info(`OPERATING_V1_SUMMARY ${JSON.stringify({
      rosterSize,
      finalCash: result.finance.cash,
      finalP: result.fan.publicCount,
      finalO: result.fan.otakuCount,
      finalAffinity: Object.values(result.fan.members).reduce((sum, member) => sum + member.affinityCount, 0),
      totalTicketRevenue: result.weeks.reduce((sum, week) => sum + week.ticketRevenueJPY, 0),
      totalChekiGross: result.weeks.reduce((sum, week) => sum + week.chekiGrossJPY, 0),
      lowestMeanCondition: Math.min(...result.weeks.map((week) => week.meanCondition)),
    })}`);
  });
});
