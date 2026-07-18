import { describe, expect, it } from "vitest";
import {
  calculateMonthSummary,
  getMarginRate,
  normalizeMonthlyMetaRecord,
  type PharmacyEntry,
  type PharmacySettings,
} from "@/utils/pharmacy";

const settings: PharmacySettings = {
  laborCost: 500000,
  rentManagementCost: 300000,
  otherFixedCost: 200000,
  extraFixedCosts: [],
};

const entries: PharmacyEntry[] = [
  {
    id: "a",
    date: "2026-07-01",
    dispensingFee: 300000,
    otcSales: 200000,
    otcProfit: 70000,
    prescriptionCount: 40,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "b",
    date: "2026-07-02",
    dispensingFee: 350000,
    otcSales: 150000,
    otcProfit: 60000,
    prescriptionCount: 35,
    createdAt: "2026-07-02T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  },
];

describe("pharmacy calculations", () => {
  it("calculates the otc margin rate", () => {
    expect(getMarginRate(250000, 75000)).toBe(30);
    expect(getMarginRate(250000, 0)).toBe(0);
  });

  it("summarizes the monthly fixed cost progress", () => {
    const summary = calculateMonthSummary(entries, settings, "2026-07");

    expect(summary.accumulatedProfit).toBe(780000);
    expect(summary.totalOtcSales).toBe(350000);
    expect(summary.remainingFixedCost).toBe(220000);
    expect(summary.overflowNetProfit).toBe(0);
    expect(summary.progressRate).toBe(78);
  });

  it("tracks overflow profit after fixed cost is covered", () => {
    const summary = calculateMonthSummary(
      [
        ...entries,
        {
          id: "c",
          date: "2026-07-03",
          dispensingFee: 280000,
          otcSales: 180000,
          otcProfit: 90000,
          prescriptionCount: 30,
          createdAt: "2026-07-03T00:00:00.000Z",
          updatedAt: "2026-07-03T00:00:00.000Z",
        },
      ],
      settings,
      "2026-07",
    );

    expect(summary.accumulatedProfit).toBe(1150000);
    expect(summary.remainingFixedCost).toBe(0);
    expect(summary.overflowNetProfit).toBe(150000);
    expect(summary.progressRate).toBe(115);
  });

  it("normalizes monthly purchase and balance data by month", () => {
    const monthlyMeta = normalizeMonthlyMetaRecord({
      "2026-07": {
        otcPurchaseAmount: "3200000",
        wholesalerBalance: 1800000.4,
      },
      invalid: {
        otcPurchaseAmount: 999,
        wholesalerBalance: 999,
      },
    });

    expect(monthlyMeta["2026-07"]).toEqual({
      otcPurchaseAmount: 3200000,
      wholesalerBalance: 1800000,
    });
    expect(monthlyMeta.invalid).toBeUndefined();
  });
});
