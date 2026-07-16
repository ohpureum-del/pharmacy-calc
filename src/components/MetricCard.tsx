import { type LucideIcon } from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "teal" | "slate" | "amber";
};

const toneClassMap = {
  teal: "border-teal-200/70 bg-teal-50/70 text-teal-700",
  slate: "border-slate-200/80 bg-white/90 text-slate-700",
  amber: "border-amber-200/80 bg-amber-50/80 text-amber-700",
};

export default function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "slate",
}: MetricCardProps) {
  return (
    <div className={`rounded-3xl border p-5 shadow-lg shadow-slate-900/5 ${toneClassMap[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <div className="rounded-2xl bg-white/80 p-2 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
