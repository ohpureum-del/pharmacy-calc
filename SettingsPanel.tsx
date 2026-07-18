import { Download, Upload } from "lucide-react";
import { type ChangeEvent, type FocusEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { formatCurrency, getMonthlyFixedCost, type FixedCostItem, type PharmacySettings } from "@/utils/pharmacy";

type SettingsPanelProps = {
  settings: PharmacySettings;
  onSave: (settings: PharmacySettings) => void;
  onBackup: () => Promise<void> | void;
  onRestore: (file: File) => Promise<void>;
};

type BaseCostField = {
  key: "laborCost" | "rentManagementCost" | "otherFixedCost";
  label: string;
  value: number;
  setValue: (value: number) => void;
};

const compactInputClass =
  "mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white";

function getEditableNumberValue(value: number) {
  return value === 0 ? "" : value;
}

export default function SettingsPanel({ settings, onSave, onBackup, onRestore }: SettingsPanelProps) {
  const [laborCost, setLaborCost] = useState(settings.laborCost);
  const [rentManagementCost, setRentManagementCost] = useState(settings.rentManagementCost);
  const [otherFixedCost, setOtherFixedCost] = useState(settings.otherFixedCost);
  const [extraFixedCosts, setExtraFixedCosts] = useState<FixedCostItem[]>(settings.extraFixedCosts);
  const [pendingExtraFixedCosts, setPendingExtraFixedCosts] = useState<FixedCostItem[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLaborCost(settings.laborCost);
    setRentManagementCost(settings.rentManagementCost);
    setOtherFixedCost(settings.otherFixedCost);
    setExtraFixedCosts(settings.extraFixedCosts);
    setPendingExtraFixedCosts([]);
  }, [settings]);

  const totalFixedCost = getMonthlyFixedCost({
    laborCost,
    rentManagementCost,
    otherFixedCost,
    extraFixedCosts: [...extraFixedCosts, ...pendingExtraFixedCosts],
  });
  const baseCostFields: BaseCostField[] = [
    { key: "laborCost", label: "1. 인건비", value: laborCost, setValue: setLaborCost },
    { key: "rentManagementCost", label: "2. 월세, 관리비", value: rentManagementCost, setValue: setRentManagementCost },
    { key: "otherFixedCost", label: "3. 기타잡비", value: otherFixedCost, setValue: setOtherFixedCost },
  ];

  const handleNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
    window.requestAnimationFrame(() => event.currentTarget.select());
  };

  const persistBaseSettings = (nextExtraFixedCosts = extraFixedCosts) => {
    onSave({
      laborCost,
      rentManagementCost,
      otherFixedCost,
      extraFixedCosts: nextExtraFixedCosts,
    });
  };

  const addExtraFixedCost = () => {
    setPendingExtraFixedCosts((current) => [
      ...current,
      { id: `custom_${Date.now()}`, label: "", amount: 0 },
    ]);
  };

  const updatePendingExtraFixedCostLabel = (id: string, label: string) => {
    setPendingExtraFixedCosts((current) =>
      current.map((item) => (item.id === id ? { ...item, label } : item)),
    );
  };

  const updatePendingExtraFixedCostAmount = (id: string, amount: number) => {
    setPendingExtraFixedCosts((current) =>
      current.map((item) => (item.id === id ? { ...item, amount } : item)),
    );
  };

  const confirmPendingExtraFixedCost = (id: string) => {
    const target = pendingExtraFixedCosts.find((item) => item.id === id);
    if (!target) return;

    const nextItem = {
      ...target,
      label: target.label.trim() || `추가 항목 ${extraFixedCosts.length + 4}`,
      amount: Math.max(0, Math.round(target.amount || 0)),
    };
    const nextExtraFixedCosts = [...extraFixedCosts, nextItem];

    setExtraFixedCosts(nextExtraFixedCosts);
    setPendingExtraFixedCosts((current) => current.filter((item) => item.id !== id));
    persistBaseSettings(nextExtraFixedCosts);
  };

  const removeExtraFixedCost = (id: string) => {
    const nextExtraFixedCosts = extraFixedCosts.filter((item) => item.id !== id);
    setExtraFixedCosts(nextExtraFixedCosts);
    persistBaseSettings(nextExtraFixedCosts);
  };

  const handleExtraFixedCostKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const targetId = event.currentTarget.dataset.itemId;
    if (!targetId) return;
    confirmPendingExtraFixedCost(targetId);
  };

  const handleBackupClick = async () => {
    setIsBackingUp(true);
    setFeedbackMessage(null);

    try {
      await onBackup();
      setFeedbackMessage("백업 파일 저장 창이 열렸습니다. `budjet` 폴더를 선택해 저장해 주세요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setFeedbackMessage(error instanceof Error ? error.message : "백업 파일 저장을 완료하지 못했습니다.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleClickRestore = () => {
    if (window.showOpenFilePicker) {
      void (async () => {
        setIsRestoring(true);
        setFeedbackMessage(null);

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
          await onRestore(file);
          setFeedbackMessage("선택한 백업 파일을 불러왔습니다.");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setFeedbackMessage(error instanceof Error ? error.message : "백업 파일을 불러오지 못했습니다.");
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
    setFeedbackMessage(null);

    try {
      await onRestore(file);
      setFeedbackMessage("백업 데이터를 불러왔습니다.");
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "백업 파일을 불러오지 못했습니다.");
    } finally {
      event.target.value = "";
      setIsRestoring(false);
    }
  };

  return (
    <section className="flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">이번달 고정지출</h2>
          <p className="mt-1.5 text-xs leading-5 text-slate-600">월 고정비를 항목별로 입력하면 자동 합산됩니다.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {baseCostFields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-xs font-medium text-slate-700">{field.label}</span>
            <input
              type="number"
              min={0}
              value={getEditableNumberValue(field.value)}
              onChange={(event) => field.setValue(Number(event.target.value))}
              onFocus={handleNumberFocus}
              onBlur={() => persistBaseSettings()}
              className={compactInputClass}
            />
          </label>
        ))}

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-700">당월 고정지출 추가 항목</p>
            <button
              type="button"
              onClick={addExtraFixedCost}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              항목 추가
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {extraFixedCosts.length === 0 && pendingExtraFixedCosts.length === 0 ? (
              <p className="text-xs text-slate-500">추가할 고정지출이 있으면 항목을 더해 주세요.</p>
            ) : null}

            {extraFixedCosts.map((item, index) => (
              <div key={item.id} className="grid gap-2.5 rounded-2xl bg-white p-2.5 md:grid-cols-[1fr_auto] md:items-center">
                <p className="text-sm text-slate-700">
                  {index + 4}. {item.label} {formatCurrency(item.amount)}
                </p>
                <button
                  type="button"
                  onClick={() => removeExtraFixedCost(item.id)}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                >
                  삭제
                </button>
              </div>
            ))}

            {pendingExtraFixedCosts.map((item, index) => (
              <div key={item.id} className="grid gap-2.5 rounded-2xl bg-white p-2.5 md:grid-cols-[1.2fr_1fr_auto]">
                <input
                  type="text"
                  value={item.label}
                  onChange={(event) => updatePendingExtraFixedCostLabel(item.id, event.target.value)}
                  onKeyDown={handleExtraFixedCostKeyDown}
                  data-item-id={item.id}
                  placeholder={`추가 항목 ${index + 1} 이름`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white"
                />
                <input
                  type="number"
                  min={0}
                  value={getEditableNumberValue(item.amount)}
                  onChange={(event) => updatePendingExtraFixedCostAmount(item.id, Number(event.target.value))}
                  onKeyDown={handleExtraFixedCostKeyDown}
                  data-item-id={item.id}
                  onFocus={handleNumberFocus}
                  placeholder="금액"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => confirmPendingExtraFixedCost(item.id)}
                  className="rounded-2xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
                >
                  확인
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-right">
        <p className="text-[11px] font-medium text-slate-400">월 고정비 합계</p>
        <p className="mt-1 text-lg font-medium tracking-tight text-slate-500">{formatCurrency(totalFixedCost)}</p>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <p className="text-xs font-medium text-slate-700">데이터 백업 / 복원</p>
            <p className="mt-1 text-[11px] text-slate-500">
              입력 기록과 고정비 설정, 월별 매입/잔고를 한 번에 저장하고 다시 불러올 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleBackupClick()}
              disabled={isBackingUp}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              <Download className="h-4 w-4" />
              {isBackingUp ? "저장 준비 중..." : "백업 저장"}
            </button>
            <button
              type="button"
              onClick={handleClickRestore}
              disabled={isRestoring}
              className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {isRestoring ? "불러오는 중..." : "백업 불러오기"}
            </button>
          </div>
        </div>
        <input
          ref={restoreInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleRestoreFileChange}
          className="hidden"
        />
        {feedbackMessage ? <p className="mt-2 text-[11px] font-medium text-slate-600">{feedbackMessage}</p> : null}
      </div>
    </section>
  );
}
