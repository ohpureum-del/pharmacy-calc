import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  normalizeEntries,
  normalizeMonthlyMetaRecord,
  normalizeSettings,
  type PharmacyEntry,
  type PharmacyMonthlyMetaRecord,
  type PharmacySettings,
} from "@/utils/pharmacy";

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

    return normalizeSettings(parsed);
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
    return normalizeEntries(JSON.parse(raw));
  } catch {
    return [] as PharmacyEntry[];
  }
}

export function saveEntries(entries: PharmacyEntry[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

export function loadMonthlyMeta() {
  if (!isBrowser()) return {} as PharmacyMonthlyMetaRecord;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.monthlyMeta);
    if (!raw) return {} as PharmacyMonthlyMetaRecord;

    return normalizeMonthlyMetaRecord(JSON.parse(raw));
  } catch {
    return {} as PharmacyMonthlyMetaRecord;
  }
}

export function saveMonthlyMeta(monthlyMetaByMonth: PharmacyMonthlyMetaRecord) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.monthlyMeta, JSON.stringify(monthlyMetaByMonth));
}
