import { describe, expect, it } from "vitest";
import { runRegressionMatrix } from "./regression";

const round = (value: number) => Math.round(value * 100) / 100;

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize() {
  return [5, 9, 15].map((rosterSize) => {
    const routes = runRegressionMatrix().filter((route) => route.rosterSize === rosterSize);
    const week = (weekNumber: number) => routes.map((route) => route.weeks[weekNumber - 1]);
    const allWeeks = routes.flatMap((route) => route.weeks);
    const perMember = allWeeks.flatMap((report) => Object.values(report.perMember));
    const total = (selector: (report: typeof allWeeks[number]) => number) => allWeeks.reduce((sum, report) => sum + selector(report), 0);
    return {
      rosterSize,
      liveAttendance: {
        week1Mean: round(average(week(1).map((report) => report.attendance))),
        week12Mean: round(average(week(12).map((report) => report.attendance))),
      },
      finalFanState: {
        publicMean: round(average(week(12).map((report) => report.publicCount))),
        otakuMean: round(average(week(12).map((report) => report.otakuCount))),
        affinityTotalMean: round(average(week(12).map((report) => report.affinityTotal))),
        purchaseWeightMean: round(average(week(12).map((report) => report.purchaseWeightMean))),
      },
      chekiPerMemberPerLive: {
        requestedJPYMean: round(average(perMember.map((sale) => sale.requestedJPY))),
        requestedUnitsMean: round(average(perMember.map((sale) => sale.requestedUnits))),
        grossJPYMean: round(average(perMember.map((sale) => sale.grossJPY))),
        completedUnitsMean: round(average(perMember.map((sale) => sale.completedUnits))),
        queueLostJPYMean: round(average(perMember.map((sale) => sale.queueLostJPY))),
        queueLostBuyersMean: round(average(perMember.map((sale) => sale.queueLostBuyers))),
      },
      weeklyFinance: {
        grossMean: round(total((report) => report.grossJPY) / allWeeks.length),
        retainedMean: round(total((report) => report.retainedJPY) / allWeeks.length),
        cashFlowMean: round(total((report) => report.cashFlowJPY) / allWeeks.length),
        cashFlowWeek4Mean: round(average(week(4).map((report) => report.cashFlowJPY))),
      },
    };
  });
}

describe("5/9/15 member 12-week, 20-seed fan and Cheki regression", () => {
  it("is deterministic and preserves the aggregate fan invariants", () => {
    const first = runRegressionMatrix();
    const replay = runRegressionMatrix();
    expect(first).toEqual(replay);
    expect(first).toHaveLength(60);
    for (const route of first) for (const week of route.weeks) {
      expect(week.otakuCount).toBeGreaterThanOrEqual(0);
      expect(week.affinityTotal).toBeGreaterThanOrEqual(0);
      expect(week.purchaseWeightMean).toBeGreaterThan(0);
      for (const sales of Object.values(week.perMember)) {
        expect(sales.grossJPY).toBeLessThanOrEqual(sales.requestedJPY);
        expect(sales.completedUnits).toBeLessThanOrEqual(sales.requestedUnits);
      }
    }
    console.info(`REGRESSION_SUMMARY ${JSON.stringify(summarize())}`);
  });
});
