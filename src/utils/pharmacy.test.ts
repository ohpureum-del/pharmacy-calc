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
      "2026-08": {
        otcPurchaseItems: [
          {
            id: "a",
            company: "A제약",
            amount: 1200000.4,
            item: "감기약",
          },
          {
            id: "b",
            company: "B제약",
            amount: 800000,
            item: "소화제",
          },
        ],
        wholesalerPaymentItems: [
          {
            id: "c",
            wholesaler: "도매상1",
            amount: 500000.7,
          },
        ],
      },
      invalid: {
        otcPurchaseAmount: 999,
        wholesalerBalance: 999,
      },
    });

    expect(monthlyMeta["2026-07"]).toEqual({
      otcPurchaseItems: [
        {
          id: "migrated_otc_purchase",
          company: "기존 입력",
          amount: 3200000,
          item: "이전 데이터",
        },
      ],
      wholesalerPaymentItems: [
        {
          id: "migrated_wholesaler_payment",
          wholesaler: "기존 입력",
          amount: 1800000,
        },
      ],
      otcPurchaseAmount: 3200000,
      wholesalerBalance: 1800000,
    });
    expect(monthlyMeta["2026-08"]).toEqual({
      otcPurchaseItems: [
        {
          id: "a",
          company: "A제약",
          amount: 1200000,
          item: "감기약",
        },
        {
          id: "b",
          company: "B제약",
          amount: 800000,
          item: "소화제",
        },
      ],
      wholesalerPaymentItems: [
        {
          id: "c",
          wholesaler: "도매상1",
          amount: 500001,
        },
      ],
      otcPurchaseAmount: 2000000,
      wholesalerBalance: 500001,
    });
    expect(monthlyMeta.invalid).toBeUndefined();
  });
});
