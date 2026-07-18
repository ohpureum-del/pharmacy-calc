import { type FocusEvent } from "react";
import {
  formatCurrency,
  getMonthLabel,
  type PharmacyMonthlyMeta,
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

export default function MonthlyFinancePanel({
  months,
  selectedMonth,
  meta,
  onMonthChange,
  onSave,
}: MonthlyFinancePanelProps) {
  const handleNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
    window.requestAnimationFrame(() => event.currentTarget.select());
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

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">일반약 구매금액</span>
          <input
            type="number"
            min={0}
            value={getEditableNumberValue(meta.otcPurchaseAmount)}
            onChange={(event) =>
              onSave({
                ...meta,
                otcPurchaseAmount: Number(event.target.value),
              })
            }
            onFocus={handleNumberFocus}
            className={compactInputClass}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">도매상 결제예정금액(잔고)</span>
          <input
            type="number"
            min={0}
            value={getEditableNumberValue(meta.wholesalerBalance)}
            onChange={(event) =>
              onSave({
                ...meta,
                wholesalerBalance: Number(event.target.value),
              })
            }
            onFocus={handleNumberFocus}
            className={compactInputClass}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">선택 월 일반약 구매금액</p>
          <p className="mt-1 text-base font-semibold tracking-tight text-slate-900">
            {formatCurrency(meta.otcPurchaseAmount)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500">선택 월 도매상 결제예정금액</p>
          <p className="mt-1 text-base font-semibold tracking-tight text-slate-900">
            {formatCurrency(meta.wholesalerBalance)}
          </p>
        </div>
      </div>
    </section>
  );
}
