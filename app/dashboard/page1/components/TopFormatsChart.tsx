"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DefinitionButton } from "@/components/ui/DefinitionButton";
import { InsightButton } from "@/components/ui/InsightButton";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
];

interface TopFormatsChartProps {
  data: { month: string; [key: string]: string | number }[];
  outputTypes: string[];
}

export default function TopFormatsChart({ data, outputTypes }: TopFormatsChartProps) {
  if (data.length === 0 || outputTypes.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 p-4">
        <p className="text-sm text-gray-500">No format data available</p>
      </div>
    );
  }

  const pctData = data.map((row) => {
    const total = outputTypes.reduce((s, k) => s + (Number(row[k]) || 0), 0);
    const newRow: Record<string, string | number> = { month: row.month };
    for (const ot of outputTypes) {
      newRow[ot] =
        total > 0 ? +(((Number(row[ot]) || 0) / total) * 100).toFixed(1) : 0;
    }
    newRow._total = total;
    return newRow;
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Top Performing Formats
          </h4>
          <p className="text-[10px] text-gray-500 mt-0.5">
            % breakdown of output type by month (published volume)
          </p>
        </div>
        <div className="flex items-center gap-1">
          <DefinitionButton definition="Stacked bar chart of published volume by output type (e.g. Shorts, Long-form) per month. Shows format mix over time." />
          <InsightButton page="page1" widget="top_formats" title="Top Formats insight" />
        </div>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={pctData}
            stackOffset="none"
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {outputTypes.map((ot, i) => (
              <Bar
                key={ot}
                dataKey={ot}
                stackId="stack"
                fill={PALETTE[i % PALETTE.length]}
                name={ot}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
