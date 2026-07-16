import {
  formatCurrency,
  formatNumber,
  getEntryProfit,
  getMonthKey,
  getMonthLabel,
  type PharmacyEntry,
} from "@/utils/pharmacy";

type EntriesTableProps = {
  entries: PharmacyEntry[];
  months: string[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
};

function getWeekSummary(cells: Array<PharmacyEntry | { date: string } | null>) {
  return cells.slice(0, 6).reduce(
    (acc, cell) => {
      if (!cell || !("id" in cell)) return acc;
      return {
        dispensingFee: acc.dispensingFee + cell.dispensingFee,
        otcProfit: acc.otcProfit + cell.otcProfit,
        totalProfit: acc.totalProfit + getEntryProfit(cell),
      };
    },
    { dispensingFee: 0, otcProfit: 0, totalProfit: 0 },
  );
}

export default function EntriesTable({
  entries,
  months,
  selectedMonth,
  onMonthChange,
}: EntriesTableProps) {
  const filtered = entries.filter((entry) => getMonthKey(entry.date) === selectedMonth);
  const [year, month] = selectedMonth.split("-").map(Number);
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const calendarCells = Array.from({ length: firstDay + daysInMonth }, (_, index) => {
    if (index < firstDay) return null;
    const day = index - firstDay + 1;
    const date = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    return filtered.find((entry) => entry.date === date) ?? { date };
  });

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">월별 기록 보기</h2>
        </div>

        <label className="block min-w-44">
          <span className="text-[11px] font-medium text-slate-500">조회 월</span>
          <select
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
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

      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
        <div className="grid grid-cols-7 bg-slate-50">
          {dayLabels.map((dayLabel) => (
            <div key={dayLabel} className="border-b border-slate-200 px-2 py-2.5 text-center text-[11px] font-semibold text-slate-500">
              {dayLabel}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7">
          {calendarCells.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="min-h-32 border-b border-r border-slate-100 bg-slate-50/40 p-2.5" />;
            }

            const columnIndex = index % 7;
            if (columnIndex === 6) {
              const weekStart = index - columnIndex;
              const weekSum = getWeekSummary(calendarCells.slice(weekStart, weekStart + 7));

              return (
                <div key={cell.date} className="min-h-32 border-b border-r border-slate-100 bg-slate-50/40 p-2.5">
                  <p className="text-[11px] font-semibold text-slate-500">주간 누적</p>
                  <div className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-600">
                    <p>조제료 {formatCurrency(weekSum.dispensingFee)}</p>
                    <p>일반약순이익 {formatCurrency(weekSum.otcProfit)}</p>
                    <p className="font-semibold text-slate-700">총 순이익 {formatCurrency(weekSum.totalProfit)}</p>
                  </div>
                </div>
              );
            }

            if ("id" in cell) {
              return (
                <div key={cell.date} className="min-h-32 border-b border-r border-slate-100 p-2.5">
                  <p className="text-sm font-semibold text-slate-900">{Number(cell.date.slice(-2))}일</p>
                  <div className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-600">
                    <p>조제건수 {formatNumber(cell.prescriptionCount || 0)}건</p>
                    <p>조제료 {formatCurrency(cell.dispensingFee)}</p>
                    <p>일반약순이익 {formatCurrency(cell.otcProfit)}</p>
                    <p className="font-semibold text-teal-700">일 총 순이익 {formatCurrency(getEntryProfit(cell))}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={cell.date} className="min-h-32 border-b border-r border-slate-100 p-2.5">
                <p className="text-sm font-semibold text-slate-400">{Number(cell.date.slice(-2))}일</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
