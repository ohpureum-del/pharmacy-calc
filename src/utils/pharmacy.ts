export type PharmacyEntry = {
  id: string;
  date: string;
  dispensingFee: number;
  otcSales: number;
  otcProfit: number;
  prescriptionCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type PharmacySettings = {
  laborCost: number;
  rentManagementCost: number;
  otherFixedCost: number;
  extraFixedCosts: FixedCostItem[];
};

export type FixedCostItem = {
  id: string;
  label: string;
  amount: number;
};

export type PharmacyEntryDraft = {
  date: string;
  dispensingFee: number;
  otcSales: number;
  otcProfit: number;
  prescriptionCount?: number;
};

export type MonthSummary = {
  month: string;
  fixedCostGoal: number;
  accumulatedProfit: number;
  progressRate: number;
  remainingFixedCost: number;
  overflowNetProfit: number;
  totalDispensingFee: number;
  totalOtcSales: number;
  totalOtcProfit: number;
  totalPrescriptionCount: number;
  entryCount: number;
};

export const STORAGE_KEYS = {
  settings: "pharmacy-finance-settings",
  entries: "pharmacy-finance-entries",
} as const;

export const DEFAULT_SETTINGS: PharmacySettings = {
  laborCost: 0,
  rentManagementCost: 0,
  otherFixedCost: 4500000,
  extraFixedCosts: [],
};

export const currencyFormatter = new Intl.NumberFormat("ko-KR");

export function formatCurrency(value: number) {
  return `${currencyFormatter.format(Math.round(value || 0))}원`;
}

export function formatNumber(value: number) {
  return currencyFormatter.format(Math.round(value || 0));
}

export function getTodayDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function getMonthKey(date: string) {
  return date.slice(0, 7);
}

export function getMonthLabel(month: string) {
  const [year, value] = month.split("-");
  return `${year}년 ${Number(value)}월`;
}

export function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}년 ${month}월 ${day}일`;
}

export function getMonthlyFixedCost(settings: PharmacySettings) {
  const customFixedCosts = settings.extraFixedCosts.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  return (
    Math.max(0, settings.laborCost) +
    Math.max(0, settings.rentManagementCost) +
    Math.max(0, settings.otherFixedCost) +
    customFixedCosts
  );
}

export function getEntryProfit(entry: Pick<PharmacyEntry, "dispensingFee" | "otcProfit">) {
  return Number(entry.dispensingFee || 0) + Number(entry.otcProfit || 0);
}

export function getMarginRate(otcSales: number, otcProfit: number) {
  if (otcSales <= 0 || otcProfit <= 0) return 0;
  return Math.round((((otcProfit / otcSales) * 100) + Number.EPSILON) * 10) / 10;
}

export function sortEntriesByDate(entries: PharmacyEntry[]) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function getMonthEntries(entries: PharmacyEntry[], month: string) {
  return sortEntriesByDate(entries).filter((entry) => getMonthKey(entry.date) === month);
}

export function calculateMonthSummary(
  entries: PharmacyEntry[],
  settings: PharmacySettings,
  month: string,
): MonthSummary {
  const monthEntries = getMonthEntries(entries, month);
  const accumulatedProfit = monthEntries.reduce((sum, entry) => sum + getEntryProfit(entry), 0);
  const totalDispensingFee = monthEntries.reduce((sum, entry) => sum + entry.dispensingFee, 0);
  const totalOtcSales = monthEntries.reduce((sum, entry) => sum + entry.otcSales, 0);
  const totalOtcProfit = monthEntries.reduce((sum, entry) => sum + entry.otcProfit, 0);
  const totalPrescriptionCount = monthEntries.reduce(
    (sum, entry) => sum + Number(entry.prescriptionCount || 0),
    0,
  );
  const fixedCostGoal = getMonthlyFixedCost(settings);
  const progressRate =
    fixedCostGoal > 0 ? Math.round(((accumulatedProfit / fixedCostGoal) * 100 + Number.EPSILON) * 10) / 10 : 0;
  const remainingFixedCost = Math.max(fixedCostGoal - accumulatedProfit, 0);
  const overflowNetProfit = Math.max(accumulatedProfit - fixedCostGoal, 0);

  return {
    month,
    fixedCostGoal,
    accumulatedProfit,
    progressRate,
    remainingFixedCost,
    overflowNetProfit,
    totalDispensingFee,
    totalOtcSales,
    totalOtcProfit,
    totalPrescriptionCount,
    entryCount: monthEntries.length,
  };
}

export function toMonthOptions(entries: PharmacyEntry[], fallbackMonth: string) {
  const months = new Set<string>([fallbackMonth]);
  entries.forEach((entry) => months.add(getMonthKey(entry.date)));
  return [...months].sort((a, b) => b.localeCompare(a));
}

export function getTodayEntry(entries: PharmacyEntry[]) {
  const today = getTodayDateString();
  return entries.find((entry) => entry.date === today);
}

export function createEntryDraft(date = getTodayDateString()): PharmacyEntryDraft {
  return {
    date,
    dispensingFee: 0,
    otcSales: 0,
    otcProfit: 0,
    prescriptionCount: undefined,
  };
}

export function toEntryPayload(
  draft: PharmacyEntryDraft,
  existing?: PharmacyEntry,
): PharmacyEntry {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? `entry_${draft.date}`,
    date: draft.date,
    dispensingFee: Math.max(0, Math.round(draft.dispensingFee || 0)),
    otcSales: Math.max(0, Math.round(draft.otcSales || 0)),
    otcProfit: Math.max(0, Math.round(draft.otcProfit || 0)),
    prescriptionCount:
      draft.prescriptionCount && draft.prescriptionCount > 0
        ? Math.round(draft.prescriptionCount)
        : undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function toDraftFromEntry(entry: PharmacyEntry): PharmacyEntryDraft {
  return {
    date: entry.date,
    dispensingFee: entry.dispensingFee,
    otcSales: entry.otcSales,
    otcProfit: entry.otcProfit,
    prescriptionCount: entry.prescriptionCount,
  };
}
