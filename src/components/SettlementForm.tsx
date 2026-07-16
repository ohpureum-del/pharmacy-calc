import { PencilLine, RotateCcw, Save } from "lucide-react";
import { type FocusEvent } from "react";
import {
  formatCurrency,
  formatDateLabel,
  getEntryProfit,
  getMarginRate,
  type PharmacyEntryDraft,
} from "@/utils/pharmacy";

type SettlementFormProps = {
  draft: PharmacyEntryDraft;
  editing: boolean;
  readOnly: boolean;
  existingDates: string[];
  onStartEdit: () => void;
  onChange: (nextDraft: PharmacyEntryDraft) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

export default function SettlementForm({
  draft,
  editing,
  readOnly,
  existingDates,
  onStartEdit,
  onChange,
  onSubmit,
  onCancelEdit,
}: SettlementFormProps) {
  const todayProfit = getEntryProfit({
    dispensingFee: draft.dispensingFee,
    otcProfit: draft.otcProfit,
  });
  const marginRate = getMarginRate(draft.otcSales, draft.otcProfit);

  const isExistingDate = existingDates.includes(draft.date);
  const handleNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
    window.requestAnimationFrame(() => event.currentTarget.select());
  };
  const compactInputClass =
    "mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white";
  const getEditableNumberValue = (value: number) => (readOnly ? value : value === 0 ? "" : value);

  return (
    <section className="flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">데이터입력</h2>
        </div>
        {editing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            새 입력으로 돌아가기
          </button>
        ) : readOnly ? (
          <button
            type="button"
            onClick={onStartEdit}
            className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 transition hover:border-teal-300 hover:bg-teal-100"
          >
            <PencilLine className="h-4 w-4" />
            수정
          </button>
        ) : null}
      </div>

      {!editing && isExistingDate ? (
        <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
          저장된 기록이 있는 날짜입니다. {readOnly ? "수정하려면 오른쪽 수정 버튼을 눌러 주세요." : "저장하면 해당 날짜 기록이 갱신됩니다."}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">정산 날짜</span>
          <input
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
            disabled={editing}
            className={compactInputClass}
          />
          <span className="mt-1.5 block text-[11px] text-slate-500">{formatDateLabel(draft.date)}</span>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">당일 조제 건수</span>
            <input
              type="number"
              min={0}
              value={draft.prescriptionCount ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  prescriptionCount: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              onFocus={handleNumberFocus}
              disabled={readOnly}
              className={compactInputClass}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">당일 조제료</span>
            <input
              type="number"
              min={0}
              value={getEditableNumberValue(draft.dispensingFee)}
              onChange={(event) => onChange({ ...draft, dispensingFee: Number(event.target.value) })}
              onFocus={handleNumberFocus}
              disabled={readOnly}
              className={compactInputClass}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">당일 일반약 매출</span>
            <input
              type="number"
              min={0}
              value={getEditableNumberValue(draft.otcSales)}
              onChange={(event) => onChange({ ...draft, otcSales: Number(event.target.value) })}
              onFocus={handleNumberFocus}
              disabled={readOnly}
              className={compactInputClass}
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-700">당일 일반약 순이익</span>
              <span className="text-[11px] font-medium text-slate-500">마진률 {marginRate.toFixed(1)}%</span>
            </div>
            <input
              type="number"
              min={0}
              value={getEditableNumberValue(draft.otcProfit)}
              onChange={(event) => onChange({ ...draft, otcProfit: Number(event.target.value) })}
              onFocus={handleNumberFocus}
              disabled={readOnly}
              className={compactInputClass}
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-base font-medium tracking-tight text-slate-400">
          오늘 순수익 {formatCurrency(todayProfit)}
        </p>
        {!readOnly ? (
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            {editing ? <PencilLine className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {editing ? "수정 내용 저장" : "정산 저장"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
