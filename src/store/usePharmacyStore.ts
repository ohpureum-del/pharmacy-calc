import { create } from "zustand";
import {
  calculateMonthSummary,
  DEFAULT_SETTINGS,
  getMonthKey,
  getTodayDateString,
  sortEntriesByDate,
  toEntryPayload,
  type PharmacyEntry,
  type PharmacyEntryDraft,
  type PharmacySettings,
} from "@/utils/pharmacy";
import { loadEntries, loadSettings, saveEntries, saveSettings } from "@/utils/storage";

type PharmacyState = {
  settings: PharmacySettings;
  entries: PharmacyEntry[];
  celebrationTick: number;
  lastSavedAt: string | null;
  initialize: () => void;
  updateSettings: (settings: PharmacySettings) => void;
  saveEntry: (draft: PharmacyEntryDraft, editingId?: string | null) => PharmacyEntry;
  deleteEntry: (id: string) => void;
};

const currentMonth = getMonthKey(getTodayDateString());

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  entries: [],
  celebrationTick: 0,
  lastSavedAt: null,

  initialize: () => {
    const settings = loadSettings();
    const entries = sortEntriesByDate(loadEntries());
    set({ settings, entries });
  },

  updateSettings: (settings) => {
    const normalized = {
      laborCost: Math.max(0, Math.round(settings.laborCost || 0)),
      rentManagementCost: Math.max(0, Math.round(settings.rentManagementCost || 0)),
      otherFixedCost: Math.max(0, Math.round(settings.otherFixedCost || 0)),
      extraFixedCosts: (settings.extraFixedCosts ?? []).map((item) => ({
        id: item.id,
        label: item.label.trim(),
        amount: Math.max(0, Math.round(item.amount || 0)),
      })),
    };

    saveSettings(normalized);
    set({ settings: normalized, lastSavedAt: new Date().toISOString() });
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
}));
