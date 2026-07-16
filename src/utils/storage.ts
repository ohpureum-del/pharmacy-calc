import { DEFAULT_SETTINGS, STORAGE_KEYS, type PharmacyEntry, type PharmacySettings } from "@/utils/pharmacy";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSettings() {
  if (!isBrowser()) return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<PharmacySettings> & {
      monthlyFixedCost?: number;
    };
    const migratedTotal = Number(parsed.monthlyFixedCost ?? DEFAULT_SETTINGS.otherFixedCost);

    return {
      laborCost: Number(parsed.laborCost ?? 0),
      rentManagementCost: Number(parsed.rentManagementCost ?? 0),
      otherFixedCost: Number(parsed.otherFixedCost ?? migratedTotal),
      extraFixedCosts: Array.isArray(parsed.extraFixedCosts)
        ? parsed.extraFixedCosts.map((item) => ({
            id: String(item.id),
            label: String(item.label ?? ""),
            amount: Number(item.amount ?? 0),
          }))
        : [],
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PharmacySettings) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadEntries() {
  if (!isBrowser()) return [] as PharmacyEntry[];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.entries);
    if (!raw) return [] as PharmacyEntry[];

    const parsed = JSON.parse(raw) as PharmacyEntry[];
    if (!Array.isArray(parsed)) return [] as PharmacyEntry[];

    return parsed
      .filter((entry) => entry && typeof entry.date === "string")
      .map((entry) => ({
        ...entry,
        dispensingFee: Number(entry.dispensingFee || 0),
        otcSales: Number(entry.otcSales || 0),
        otcProfit: Number(entry.otcProfit || 0),
        prescriptionCount: entry.prescriptionCount ? Number(entry.prescriptionCount) : undefined,
      }));
  } catch {
    return [] as PharmacyEntry[];
  }
}

export function saveEntries(entries: PharmacyEntry[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}
