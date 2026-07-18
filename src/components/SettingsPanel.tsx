import { type FocusEvent, type KeyboardEvent, useEffect, useState } from "react";
import { formatCurrency, getMonthlyFixedCost, type FixedCostItem, type PharmacySettings } from "@/utils/pharmacy";

type SettingsPanelProps = {
  settings: PharmacySettings;
  onSave: (settings: PharmacySettings) => void;
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

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [laborCost, setLaborCost] = useState(settings.laborCost);
  const [rentManagementCost, setRentManagementCost] = useState(settings.rentManagementCost);
  const [otherFixedCost, setOtherFixedCost] = useState(settings.otherFixedCost);
  const [extraFixedCosts, setExtraFixedCosts] = useState<FixedCostItem[]>(settings.extraFixedCosts);
  const [pendingExtraFixedCosts, setPendingExtraFixedCosts] = useState<FixedCostItem[]>([]);

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

  return (
    <section className="flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">이번달 운영비</h2>
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
            <p className="text-xs font-medium text-slate-700">추가항목</p>
            <button
              type="button"
              onClick={addExtraFixedCost}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              항목 추가
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
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
    </section>
  );
}
