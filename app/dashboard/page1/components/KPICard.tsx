"use client";

interface KPICardProps {
  label: string;
  value: string;
  tooltip: string;
  trendPct: number | null;
  /** "higher" = positive trend is good, "lower" = negative trend is good */
  improvementDirection: "higher" | "lower" | "none";
}

export default function KPICard({
  label,
  value,
  tooltip,
  trendPct,
  improvementDirection,
}: KPICardProps) {
  const hasTrend = trendPct !== null && improvementDirection !== "none";
  const isImprovement =
    improvementDirection === "higher"
      ? trendPct! > 0
      : improvementDirection === "lower"
        ? trendPct! < 0
        : false;
  const isDecline =
    improvementDirection === "higher"
      ? trendPct! < 0
      : improvementDirection === "lower"
        ? trendPct! > 0
        : false;

  return (
    <div
      className="rounded-lg border border-gray-200 p-3 transition-all hover:shadow-md cursor-default group hover:border-emerald-200 hover:bg-emerald-50/50"
      title={tooltip}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 min-w-0">
          {label}
        </div>
        <span
          className="shrink-0 h-4 w-4 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 cursor-help"
          title={tooltip}
          aria-label={tooltip}
        >
          ?
        </span>
      </div>
      <div className="text-lg font-bold text-gray-900 mt-0.5">{value}</div>
      {hasTrend && (
        <div
          className={`text-[11px] font-semibold mt-0.5 ${
            isImprovement ? "text-emerald-500" : isDecline ? "text-red-500" : "text-gray-400"
          }`}
        >
          {trendPct! >= 0 ? "↑" : "↓"} {Math.abs(Math.round(trendPct! * 10) / 10)}%
          <span className="text-[10px] font-normal text-gray-400 ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}
