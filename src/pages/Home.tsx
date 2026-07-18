import { AppWindow, Download, Upload } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import EntriesTable from "@/components/EntriesTable";
import MonthlyFinancePanel from "@/components/MonthlyFinancePanel";
import ProgressGauge from "@/components/ProgressGauge";
import SettlementForm from "@/components/SettlementForm";
import SettingsPanel from "@/components/SettingsPanel";
import { usePharmacyStore } from "@/store/usePharmacyStore";
import {
  calculateMonthSummary,
  createEntryDraft,
  DEFAULT_MONTHLY_META,
  formatCurrency,
  formatNumber,
  getEntryProfit,
  getMonthLabel,
  getMonthKey,
  getTodayDateString,
  toDraftFromEntry,
  toMonthOptions,
  type PharmacyEntryDraft,
} from "@/utils/pharmacy";

export default function Home() {
  const {
    settings,
    entries,
    monthlyMetaByMonth,
    celebrationTick,
    initialize,
    updateSettings,
    updateMonthlyMeta,
    saveEntry,
    exportBackup,
    importBackup,
  } =
    usePharmacyStore();

  const today = getTodayDateString();
  const currentMonth = getMonthKey(today);
  const [draft, setDraft] = useState<PharmacyEntryDraft>(createEntryDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedFinanceMonth, setSelectedFinanceMonth] = useState(currentMonth);
  const [showCelebration, setShowCelebration] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalledApp, setIsInstalledApp] = useState(false);
  const [backupFeedbackMessage, setBackupFeedbackMessage] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!celebrationTick) return;
    setShowCelebration(true);
    const timer = window.setTimeout(() => setShowCelebration(false), 2800);
    return () => window.clearTimeout(timer);
  }, [celebrationTick]);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const updateInstallState = () => setIsInstalledApp(media.matches);
    updateInstallState();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalledApp(true);
      setInstallPromptEvent(null);
    };

    media.addEventListener("change", updateInstallState);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      media.removeEventListener("change", updateInstallState);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const monthSummary = useMemo(
    () => calculateMonthSummary(entries, settings, currentMonth),
    [entries, settings, currentMonth],
  );
  const todayEntry = useMemo(() => entries.find((entry) => entry.date === today), [entries, today]);
  const months = useMemo(() => toMonthOptions(entries, currentMonth), [entries, currentMonth]);
  const currentMonthMeta = monthlyMetaByMonth[currentMonth] ?? DEFAULT_MONTHLY_META;
  const selectedFinanceMeta = monthlyMetaByMonth[selectedFinanceMonth] ?? DEFAULT_MONTHLY_META;
  const selectedMonthSummary = useMemo(
    () => calculateMonthSummary(entries, settings, selectedMonth),
    [entries, settings, selectedMonth],
  );
  const selectedMonthMeta = monthlyMetaByMonth[selectedMonth] ?? DEFAULT_MONTHLY_META;

  const handleSettingsSubmit = (nextSettings: typeof settings) => {
    updateSettings(nextSettings);
  };

  const handleMonthlyMetaSave = (month: string, nextMeta: typeof currentMonthMeta) => {
    updateMonthlyMeta(month, nextMeta);
  };

  const handleBackup = async () => {
    const backup = exportBackup();
    const fileName = `약국-경영정산-백업-${today}.json`;
    const backupText = JSON.stringify(backup, null, 2);

    if (window.showSaveFilePicker) {
      const fileHandle = await window.showSaveFilePicker({
        id: "pharmacy-backup-save",
        suggestedName: fileName,
        types: [
          {
            description: "약국 경영정산 백업 파일",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(backupText);
      await writable.close();
      return;
    }

    const blob = new Blob([backupText], { type: "application/json;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBackupClick = async () => {
    setIsBackingUp(true);
    setBackupFeedbackMessage(null);

    try {
      await handleBackup();
      setBackupFeedbackMessage("백업 파일 저장 창이 열렸습니다. 원하는 폴더를 선택해 저장해 주세요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setBackupFeedbackMessage(error instanceof Error ? error.message : "백업 파일 저장을 완료하지 못했습니다.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (file: File) => {
    const text = await file.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("JSON 백업 파일만 불러올 수 있습니다.");
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("백업 파일 형식이 올바르지 않습니다.");
    }

    importBackup(parsed as ReturnType<typeof exportBackup>);
    setDraft(createEntryDraft());
    setEditingId(null);
    setSelectedMonth(currentMonth);
    setSelectedFinanceMonth(currentMonth);
  };

  const handleClickRestore = () => {
    if (window.showOpenFilePicker) {
      void (async () => {
        setIsRestoring(true);
        setBackupFeedbackMessage(null);

        try {
          const [fileHandle] = await window.showOpenFilePicker({
            id: "pharmacy-backup-open",
            types: [
              {
                description: "약국 경영정산 백업 파일",
                accept: {
                  "application/json": [".json"],
                },
              },
            ],
          });

          const file = await fileHandle.getFile();
          await handleRestore(file);
          setBackupFeedbackMessage("선택한 백업 파일을 불러왔습니다.");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setBackupFeedbackMessage(error instanceof Error ? error.message : "백업 파일을 불러오지 못했습니다.");
        } finally {
          setIsRestoring(false);
        }
      })();
      return;
    }

    restoreInputRef.current?.click();
  };

  const handleRestoreFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setBackupFeedbackMessage(null);

    try {
      await handleRestore(file);
      setBackupFeedbackMessage("백업 데이터를 불러왔습니다.");
    } catch (error) {
      setBackupFeedbackMessage(error instanceof Error ? error.message : "백업 파일을 불러오지 못했습니다.");
    } finally {
      event.target.value = "";
      setIsRestoring(false);
    }
  };

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPromptEvent(null);
    }
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
    { label: "일반약 매입", value: formatCurrency(currentMonthMeta.otcPurchaseAmount) },
    { label: "도매상 결제예정", value: formatCurrency(currentMonthMeta.wholesalerBalance) },
  ];
  const todayCards = [
    { label: "순이익", value: formatCurrency(todayProfit) },
    { label: "조제료", value: formatCurrency(todayDispensingFee) },
    { label: "일반약매출", value: formatCurrency(todayOtcSales) },
    { label: "일반약순이익", value: formatCurrency(todayOtcProfit) },
  ];
  const selectedMonthCards = [
    { label: "월 총 순이익", value: formatCurrency(selectedMonthSummary.accumulatedProfit) },
    { label: "조제료 합계", value: formatCurrency(selectedMonthSummary.totalDispensingFee) },
    { label: "조제건수 합계", value: `${formatNumber(selectedMonthSummary.totalPrescriptionCount)}건` },
    { label: "일반약 매출 합계", value: formatCurrency(selectedMonthSummary.totalOtcSales) },
    { label: "일반약 순이익 합계", value: formatCurrency(selectedMonthSummary.totalOtcProfit) },
    { label: "일반약 매입 합계", value: formatCurrency(selectedMonthMeta.otcPurchaseAmount) },
    { label: "도매상 결제예정", value: formatCurrency(selectedMonthMeta.wholesalerBalance) },
    { label: "입력 일수", value: `${formatNumber(selectedMonthSummary.entryCount)}일` },
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
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {installPromptEvent && !isInstalledApp ? (
                <button
                  type="button"
                  onClick={() => void handleInstallApp()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 transition hover:border-teal-300 hover:bg-teal-100"
                >
                  <AppWindow className="h-4 w-4" />
                  바탕화면 앱으로 설치
                </button>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white/90 px-3.5 py-2 text-[11px] font-medium text-slate-600">
                  {isInstalledApp
                    ? "이미 바탕화면 앱으로 설치된 상태입니다."
                    : "설치 버튼이 안 보이면 Edge/Chrome 메뉴에서 `앱 설치` 또는 `바탕화면에 추가`를 눌러 주세요."}
                </div>
              )}
              <button
                type="button"
                onClick={() => void handleBackupClick()}
                disabled={isBackingUp}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {isBackingUp ? "저장 준비 중..." : "백업 저장"}
              </button>
              <button
                type="button"
                onClick={handleClickRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {isRestoring ? "불러오는 중..." : "백업 불러오기"}
              </button>
            </div>
            <input
              ref={restoreInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleRestoreFileChange}
              className="hidden"
            />
            {backupFeedbackMessage ? (
              <p className="mt-3 text-xs font-medium text-slate-600">{backupFeedbackMessage}</p>
            ) : null}
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
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
          <SettingsPanel
            settings={settings}
            onSave={handleSettingsSubmit}
          />
        </div>
        <div className="mt-4">
          <MonthlyFinancePanel
            months={months}
            selectedMonth={selectedFinanceMonth}
            meta={selectedFinanceMeta}
            onMonthChange={setSelectedFinanceMonth}
            onSave={(meta) => handleMonthlyMetaSave(selectedFinanceMonth, meta)}
          />
        </div>
        <div className="mt-4">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">월별 합산 요약</h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  원하는 월을 고르면 조제료, 조제건수, 일반약 매입/순이익까지 카드로 한눈에 볼 수 있습니다.
                </p>
              </div>

              <label className="block min-w-44">
                <span className="text-[11px] font-medium text-slate-500">조회 월</span>
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white"
                >
                  {months.map((monthOption) => (
                    <option key={monthOption} value={monthOption}>
                      {getMonthLabel(monthOption)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {selectedMonthCards.map((card) => (
                <div key={card.label} className="rounded-2xl bg-slate-50 p-3.5">
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">{card.value}</p>
                </div>
              ))}
            </div>
          </section>
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
