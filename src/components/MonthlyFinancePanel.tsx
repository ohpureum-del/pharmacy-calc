import { type FocusEvent, useEffect, useState } from "react";
import {
  formatCurrency,
  getMonthLabel,
  type OtcPurchaseItem,
  type PharmacyMonthlyMeta,
  type WholesalerPaymentItem,
} from "@/utils/pharmacy";

type MonthlyFinancePanelProps = {
  months: string[];
  selectedMonth: string;
  meta: PharmacyMonthlyMeta;
  onMonthChange: (month: string) => void;
  onSave: (meta: PharmacyMonthlyMeta) => void;
};

const compactInputClass =
  "mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white";

function getEditableNumberValue(value: number) {
  return value === 0 ? "" : value;
}

type PendingOtcPurchaseItem = Omit<OtcPurchaseItem, "id"> & { id: string };
type PendingWholesalerPaymentItem = Omit<WholesalerPaymentItem, "id"> & { id: string };

export default function MonthlyFinancePanel({
  months,
  selectedMonth,
  meta,
  onMonthChange,
  onSave,
}: MonthlyFinancePanelProps) {
  const [pendingOtcPurchaseItems, setPendingOtcPurchaseItems] = useState<PendingOtcPurchaseItem[]>([]);
  const [pendingWholesalerPaymentItems, setPendingWholesalerPaymentItems] = useState<PendingWholesalerPaymentItem[]>([]);

  useEffect(() => {
    setPendingOtcPurchaseItems([]);
    setPendingWholesalerPaymentItems([]);
  }, [selectedMonth]);

  const handleNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
    window.requestAnimationFrame(() => event.currentTarget.select());
  };

  const addPendingOtcPurchaseItem = () => {
    setPendingOtcPurchaseItems((current) => [
      ...current,
      { id: `pending_otc_purchase_${Date.now()}`, company: "", amount: 0, item: "" },
    ]);
  };

  const addPendingWholesalerPaymentItem = () => {
    setPendingWholesalerPaymentItems((current) => [
      ...current,
      { id: `pending_wholesaler_payment_${Date.now()}`, wholesaler: "", amount: 0 },
    ]);
  };

  const updatePendingOtcPurchaseItem = (
    id: string,
    field: keyof Omit<PendingOtcPurchaseItem, "id">,
    value: string | number,
  ) => {
    setPendingOtcPurchaseItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const updatePendingWholesalerPaymentItem = (
    id: string,
    field: keyof Omit<PendingWholesalerPaymentItem, "id">,
    value: string | number,
  ) => {
    setPendingWholesalerPaymentItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const confirmPendingOtcPurchaseItem = (id: string) => {
    const target = pendingOtcPurchaseItems.find((item) => item.id === id);
    if (!target) return;

    const nextItem: OtcPurchaseItem = {
      id: `otc_purchase_${Date.now()}`,
      company: target.company.trim() || `제약사 ${meta.otcPurchaseItems.length + 1}`,
      amount: Math.max(0, Math.round(target.amount || 0)),
      item: target.item.trim() || "기타",
    };

    onSave({
      ...meta,
      otcPurchaseItems: [...meta.otcPurchaseItems, nextItem],
    });
    setPendingOtcPurchaseItems((current) => current.filter((item) => item.id !== id));
  };

  const confirmPendingWholesalerPaymentItem = (id: string) => {
    const target = pendingWholesalerPaymentItems.find((item) => item.id === id);
    if (!target) return;

    const nextItem: WholesalerPaymentItem = {
      id: `wholesaler_payment_${Date.now()}`,
      wholesaler: target.wholesaler.trim() || `도매상 ${meta.wholesalerPaymentItems.length + 1}`,
      amount: Math.max(0, Math.round(target.amount || 0)),
    };

    onSave({
      ...meta,
      wholesalerPaymentItems: [...meta.wholesalerPaymentItems, nextItem],
    });
    setPendingWholesalerPaymentItems((current) => current.filter((item) => item.id !== id));
  };

  const removeOtcPurchaseItem = (id: string) => {
    onSave({
      ...meta,
      otcPurchaseItems: meta.otcPurchaseItems.filter((item) => item.id !== id),
    });
  };

  const removeWholesalerPaymentItem = (id: string) => {
    onSave({
      ...meta,
      wholesalerPaymentItems: meta.wholesalerPaymentItems.filter((item) => item.id !== id),
    });
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">월별 일반약 매입 / 잔고</h2>
          <p className="mt-1.5 text-xs leading-5 text-slate-600">
            {getMonthLabel(selectedMonth)} 기준 일반약 구매금액과 도매상 결제예정금액을 따로 적어둘 수 있습니다.
          </p>
        </div>

        <label className="block min-w-44">
          <span className="text-[11px] font-medium text-slate-500">기준 월</span>
          <select
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className={compactInputClass}
          >
            {months.map((monthOption) => (
              <option key={monthOption} value={monthOption}>
                {getMonthLabel(monthOption)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">일반약 구매금액</p>
              <p className="mt-1 text-[11px] text-slate-500">제약사, 결제금액, 항목을 입력한 뒤 확인해 누적합니다.</p>
            </div>
            <button
              type="button"
              onClick={addPendingOtcPurchaseItem}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              항목 추가
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {meta.otcPurchaseItems.length === 0 && pendingOtcPurchaseItems.length === 0 ? (
              <p className="text-xs text-slate-500">이번 달 일반약 구매 내역이 아직 없습니다.</p>
            ) : null}

            {meta.otcPurchaseItems.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2.5 rounded-2xl bg-white p-3 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto] 2xl:items-center"
              >
                <p className="min-w-0 break-words text-sm text-slate-700">{index + 1}. {item.company}</p>
                <p className="text-sm font-medium text-slate-900">{formatCurrency(item.amount)}</p>
                <p className="min-w-0 break-words text-sm text-slate-600">{item.item}</p>
                <button
                  type="button"
                  onClick={() => removeOtcPurchaseItem(item.id)}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 sm:col-span-2 2xl:col-span-1"
                >
                  삭제
                </button>
              </div>
            ))}

            {pendingOtcPurchaseItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-2.5 rounded-2xl bg-white p-3 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto]"
              >
                <input
                  type="text"
                  value={item.company}
                  onChange={(event) => updatePendingOtcPurchaseItem(item.id, "company", event.target.value)}
                  placeholder="제약사"
                  className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white"
                />
                <input
                  type="number"
                  min={0}
                  value={getEditableNumberValue(item.amount)}
                  onChange={(event) =>
                    updatePendingOtcPurchaseItem(item.id, "amount", Number(event.target.value))
                  }
                  onFocus={handleNumberFocus}
                  placeholder="결제금액"
                  className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white"
                />
                <input
                  type="text"
                  value={item.item}
                  onChange={(event) => updatePendingOtcPurchaseItem(item.id, "item", event.target.value)}
                  placeholder="항목"
                  className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => confirmPendingOtcPurchaseItem(item.id)}
                  className="rounded-2xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100 sm:col-span-2 2xl:col-span-1"
                >
                  확인
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl bg-white px-4 py-3">
            <p className="text-[11px] font-medium text-slate-500">이번달 총 누적금액</p>
            <p className="mt-1 text-base font-semibold tracking-tight text-slate-900">
              {formatCurrency(meta.otcPurchaseAmount)}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">도매상 결제예정금액</p>
              <p className="mt-1 text-[11px] text-slate-500">도매상과 결제금액을 입력한 뒤 확인해 누적합니다.</p>
            </div>
            <button
              type="button"
              onClick={addPendingWholesalerPaymentItem}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              항목 추가
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {meta.wholesalerPaymentItems.length === 0 && pendingWholesalerPaymentItems.length === 0 ? (
              <p className="text-xs text-slate-500">이번 달 도매상 결제예정 내역이 아직 없습니다.</p>
            ) : null}

            {meta.wholesalerPaymentItems.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-2.5 rounded-2xl bg-white p-3 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] 2xl:items-center"
              >
                <p className="min-w-0 break-words text-sm text-slate-700">{index + 1}. {item.wholesaler}</p>
                <p className="text-sm font-medium text-slate-900">{formatCurrency(item.amount)}</p>
                <button
                  type="button"
                  onClick={() => removeWholesalerPaymentItem(item.id)}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 sm:col-span-2 2xl:col-span-1"
                >
                  삭제
                </button>
              </div>
            ))}

            {pendingWholesalerPaymentItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-2.5 rounded-2xl bg-white p-3 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]"
              >
                <input
                  type="text"
                  value={item.wholesaler}
                  onChange={(event) =>
                    updatePendingWholesalerPaymentItem(item.id, "wholesaler", event.target.value)
                  }
                  placeholder="도매상"
                  className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white"
                />
                <input
                  type="number"
                  min={0}
                  value={getEditableNumberValue(item.amount)}
                  onChange={(event) =>
                    updatePendingWholesalerPaymentItem(item.id, "amount", Number(event.target.value))
                  }
                  onFocus={handleNumberFocus}
                  placeholder="결제금액"
                  className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => confirmPendingWholesalerPaymentItem(item.id)}
                  className="rounded-2xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100 sm:col-span-2 2xl:col-span-1"
                >
                  확인
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl bg-white px-4 py-3">
            <p className="text-[11px] font-medium text-slate-500">이번달 총 누적금액</p>
            <p className="mt-1 text-base font-semibold tracking-tight text-slate-900">
              {formatCurrency(meta.wholesalerBalance)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
