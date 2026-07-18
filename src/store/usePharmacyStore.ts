import { create } from "zustand";
import {
  calculateMonthSummary,
  normalizeEntries,
  normalizeMonthlyMeta,
  normalizeMonthlyMetaRecord,
  normalizeSettings,
  DEFAULT_SETTINGS,
  getMonthKey,
  getTodayDateString,
  sortEntriesByDate,
  toEntryPayload,
  type PharmacyBackupData,
  type PharmacyEntry,
  type PharmacyEntryDraft,
  type PharmacyMonthlyMeta,
  type PharmacyMonthlyMetaRecord,
  type PharmacySettings,
} from "@/utils/pharmacy";
import {
  loadEntries,
  loadMonthlyMeta,
  loadSettings,
  saveEntries,
  saveMonthlyMeta,
  saveSettings,
} from "@/utils/storage";

type PharmacyState = {
  settings: PharmacySettings;
  entries: PharmacyEntry[];
  monthlyMetaByMonth: PharmacyMonthlyMetaRecord;
  celebrationTick: number;
  lastSavedAt: string | null;
  initialize: () => void;
  updateSettings: (settings: PharmacySettings) => void;
  updateMonthlyMeta: (month: string, meta: PharmacyMonthlyMeta) => void;
  saveEntry: (draft: PharmacyEntryDraft, editingId?: string | null) => PharmacyEntry;
  deleteEntry: (id: string) => void;
  exportBackup: () => PharmacyBackupData;
  importBackup: (backup: PharmacyBackupData) => void;
};

const currentMonth = getMonthKey(getTodayDateString());

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  entries: [],
  monthlyMetaByMonth: {},
  celebrationTick: 0,
  lastSavedAt: null,

  initialize: () => {
    const settings = loadSettings();
    const entries = sortEntriesByDate(loadEntries());
    const monthlyMetaByMonth = loadMonthlyMeta();
    set({ settings, entries, monthlyMetaByMonth });
  },

  updateSettings: (settings) => {
    const normalized = normalizeSettings(settings);

    saveSettings(normalized);
    set({ settings: normalized, lastSavedAt: new Date().toISOString() });
  },

  updateMonthlyMeta: (month, meta) => {
    const normalizedMeta = normalizeMonthlyMeta(meta);
    const nextMonthlyMetaByMonth = {
      ...get().monthlyMetaByMonth,
      [month]: normalizedMeta,
    };

    saveMonthlyMeta(nextMonthlyMetaByMonth);
    set({
      monthlyMetaByMonth: nextMonthlyMetaByMonth,
      lastSavedAt: new Date().toISOString(),
    });
  },

  saveEntry: (draft, editingId) => {
    const { entries, settings, celebrationTick } = get();
    const editingEntry = editingId ? entries.find((entry) => entry.id === editingId) : undefined;
    const sameDateEntry = !editingId ? entries.find((entry) => entry.date === draft.date) : undefined;
    const baseEntry = editingEntry ?? sameDateEntry;
    const nextEntry = toEntryPayload(draft, baseEntry);
    const filteredEntries = entries.filter((entry) => entry.id !== baseEntry?.id);
    const nextEntries = sortEntriesByDate([...filteredEntries, nextEntry]);

    const previousSummary = calculateMonthSummary(entries, settings, currentMonth);
    const nextSummary = calculateMonthSummary(nextEntries, settings, currentMonth);
    const didReachGoal =
      previousSummary.progressRate < 100 &&
      nextSummary.progressRate >= 100 &&
      getMonthKey(nextEntry.date) === currentMonth;

    saveEntries(nextEntries);
    set({
      entries: nextEntries,
      celebrationTick: didReachGoal ? celebrationTick + 1 : celebrationTick,
      lastSavedAt: new Date().toISOString(),
    });

    return nextEntry;
  },

  deleteEntry: (id) => {
    const nextEntries = get().entries.filter((entry) => entry.id !== id);
    saveEntries(nextEntries);
    set({ entries: nextEntries, lastSavedAt: new Date().toISOString() });
  },

  exportBackup: () => {
    const { settings, entries, monthlyMetaByMonth } = get();

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      entries,
      monthlyMetaByMonth,
    };
  },

  importBackup: (backup) => {
    const normalizedSettings = normalizeSettings(backup?.settings);
    const normalizedEntries = sortEntriesByDate(normalizeEntries(backup?.entries));
    const normalizedMonthlyMetaByMonth = normalizeMonthlyMetaRecord(backup?.monthlyMetaByMonth);

    saveSettings(normalizedSettings);
    saveEntries(normalizedEntries);
    saveMonthlyMeta(normalizedMonthlyMetaByMonth);

    set({
      settings: normalizedSettings,
      entries: normalizedEntries,
      monthlyMetaByMonth: normalizedMonthlyMetaByMonth,
      lastSavedAt: new Date().toISOString(),
    });
  },
}));
