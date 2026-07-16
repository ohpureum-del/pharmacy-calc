type ProgressGaugeProps = {
  rate: number;
  accumulatedProfit: string;
  fixedCostGoal: string;
  remainingFixedCost: string;
  overflowNetProfit: string;
};

function describeStatus(rate: number) {
  if (rate >= 100) return "고정비 100% 완료";
  if (rate >= 75) return "거의 도착";
  if (rate >= 40) return "안정적으로 진행 중";
  if (rate > 0) return "고정비 충당 중";
  return "첫 정산을 입력해 주세요";
}

export default function ProgressGauge({
  rate,
  accumulatedProfit,
  fixedCostGoal,
  remainingFixedCost,
  overflowNetProfit,
}: ProgressGaugeProps) {
  const clamped = Math.max(0, Math.min(rate, 140));
  const gaugeRate = Math.min(clamped, 100);
  const status = describeStatus(clamped);
  const remainingLabel = clamped >= 100 ? "고정비 완료" : `남은 고정비 ${remainingFixedCost}`;

  return (
    <div className="mt-2 grid gap-3 md:grid-cols-2 md:items-start">
      <div>
        <p className="mb-1 text-[11px] font-medium text-slate-500">목표 {fixedCostGoal}</p>
        <div className="relative h-5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400 transition-all duration-700 ease-out"
            style={{ width: `${gaugeRate}%` }}
          />
          <div className="absolute inset-y-0 left-3 flex items-center text-[11px] font-medium text-slate-600">
            총 순이익 {accumulatedProfit}
          </div>
          <div className="absolute inset-y-0 right-3 flex items-center text-[11px] font-medium text-slate-400">
            {remainingLabel}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-xl font-semibold tracking-tight text-slate-900">{clamped.toFixed(1)}%</p>
          <p className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">
            {status}
          </p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-700">초과 순이익</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{overflowNetProfit}</p>
      </div>
    </div>
  );
}
