import { useEffect, useMemo, useState } from "react";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import EntriesTable from "@/components/EntriesTable";
import ProgressGauge from "@/components/ProgressGauge";
import SettlementForm from "@/components/SettlementForm";
import SettingsPanel from "@/components/SettingsPanel";
import { usePharmacyStore } from "@/store/usePharmacyStore";
import {
  calculateMonthSummary,
  createEntryDraft,
  formatCurrency,
  getEntryProfit,
  getMonthLabel,
  getMonthKey,
  getTodayDateString,
  toDraftFromEntry,
  toMonthOptions,
  type PharmacyEntryDraft,
} from "@/utils/pharmacy";

export default function Home() {
  const { settings, entries, celebrationTick, initialize, updateSettings, saveEntry } =
    usePharmacyStore();

  const today = getTodayDateString();
  const currentMonth = getMonthKey(today);
  const [draft, setDraft] = useState<PharmacyEntryDraft>(createEntryDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!celebrationTick) return;
    setShowCelebration(true);
    const timer = window.setTimeout(() => setShowCelebration(false), 2800);
    return () => window.clearTimeout(timer);
  }, [celebrationTick]);

  const monthSummary = useMemo(
    () => calculateMonthSummary(entries, settings, currentMonth),
    [entries, settings, currentMonth],
  );
  const todayEntry = useMemo(() => entries.find((entry) => entry.date === today), [entries, today]);
  const months = useMemo(() => toMonthOptions(entries, currentMonth), [entries, currentMonth]);

  const handleSettingsSubmit = (nextSettings: typeof settings) => {
    updateSettings(nextSettings);
  };

  const syncDraftForDate = (date: string) => {
    const existingEntry = entries.find((entry) => entry.date === date);
    if (existingEntry) {
      setDraft(toDraftFromEntry(existingEntry));
      return;
    }

    setDraft(createEntryDraft(date));
  };

  const resetDraft = () => {
    setDraft(createEntryDraft());
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    syncDraftForDate(draft.date);
  };

  const handleSubmitEntry = () => {
    const saved = saveEntry(draft, editingId);
    if (editingId) {
      setEditingId(null);
      syncDraftForDate(saved.date);
      return;
    }

    resetDraft();
  };

  const existingEntryForDraftDate = useMemo(
    () => entries.find((entry) => entry.date === draft.date) ?? null,
    [entries, draft.date],
  );
  const settlementReadOnly = Boolean(existingEntryForDraftDate) && !editingId;

  const handleDraftChange = (nextDraft: PharmacyEntryDraft) => {
    if (editingId) {
      setDraft(nextDraft);
      return;
    }

    if (nextDraft.date !== draft.date) {
      syncDraftForDate(nextDraft.date);
      return;
    }

    setDraft(nextDraft);
  };

  const handleStartEdit = () => {
    if (!existingEntryForDraftDate) return;
    setEditingId(existingEntryForDraftDate.id);
  };

  const todayProfit = todayEntry ? getEntryProfit(todayEntry) : 0;
  const todayDispensingFee = todayEntry?.dispensingFee ?? 0;
  const todayOtcProfit = todayEntry?.otcProfit ?? 0;
  const todayOtcSales = todayEntry?.otcSales ?? 0;
  const monthSummaryCards = [
    { label: "이번달 총 순이익", value: formatCurrency(monthSummary.accumulatedProfit) },
    { label: "조제료 누적", value: formatCurrency(monthSummary.totalDispensingFee) },
    { label: "일반약 매출 누적", value: formatCurrency(monthSummary.totalOtcSales) },
    { label: "일반약 순이익 누적", value: formatCurrency(monthSummary.totalOtcProfit) },
  ];
  const todayCards = [
    { label: "순이익", value: formatCurrency(todayProfit) },
    { label: "조제료", value: formatCurrency(todayDispensingFee) },
    { label: "일반약매출", value: formatCurrency(todayOtcSales) },
    { label: "일반약순이익", value: formatCurrency(todayOtcProfit) },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.2),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(148,163,184,0.14),_transparent_22%),linear-gradient(180deg,_#f8fffd_0%,_#f8fafc_42%,_#eef6f5_100%)] pb-10">
      <CelebrationOverlay visible={showCelebration} />

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-white/80 bg-white/75 px-5 py-6 shadow-2xl shadow-slate-900/5 backdrop-blur md:px-7">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">PHARMACY FIXED COST LEDGER</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              약국 고정비 & 순이익 관리
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              조제료와 일반약 순이익만으로 진짜 남는 돈을 계산하고, 월 고정비를 얼마나 채웠는지 한 화면에서 확인하세요.
            </p>
          </div>

          <section className="mt-6 rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{getMonthLabel(currentMonth)} 운영 흐름</h2>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">이번 달 고정비 달성도</p>
              <ProgressGauge
                rate={monthSummary.progressRate}
                accumulatedProfit={formatCurrency(monthSummary.accumulatedProfit)}
                fixedCostGoal={formatCurrency(monthSummary.fixedCostGoal)}
                remainingFixedCost={formatCurrency(monthSummary.remainingFixedCost)}
                overflowNetProfit={formatCurrency(monthSummary.overflowNetProfit)}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {monthSummaryCards.map((card) => (
                <div key={card.label} className="rounded-2xl bg-slate-50 p-3.5">
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">{card.value}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-5 grid gap-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-600">today</p>
              <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                {todayCards.map((card) => (
                  <div key={card.label} className="rounded-2xl bg-slate-50 px-3.5 py-2.5">
                    <p className="text-[11px] text-slate-500">{card.label}</p>
                    <p className="mt-1 text-base font-semibold tracking-tight text-slate-900">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-4 xl:grid-cols-[1.06fr_0.94fr]">
          <SettlementForm
            draft={draft}
            editing={Boolean(editingId)}
            readOnly={settlementReadOnly}
            existingDates={entries.map((entry) => entry.date)}
            onStartEdit={handleStartEdit}
            onChange={handleDraftChange}
            onSubmit={handleSubmitEntry}
            onCancelEdit={handleCancelEdit}
          />
          <SettingsPanel settings={settings} onSave={handleSettingsSubmit} />
        </div>
        <div className="mt-4">
          <EntriesTable
            entries={entries}
            months={months}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </section>
    </main>
  );
}
