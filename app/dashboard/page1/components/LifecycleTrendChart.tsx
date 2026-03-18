"use client";

import "@/app/dashboard/page2/components/ChartSetup";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { CHART_FONT } from "@/app/dashboard/page2/components/ChartSetup";
import { CHART_COLORS } from "@/app/dashboard/page2/components/ChartSetup";
import type { LifecycleTrendData } from "./types";
import { useState, useMemo } from "react";
import { DefinitionButton } from "@/components/ui/DefinitionButton";

interface LifecycleTrendChartProps {
  data: LifecycleTrendData;
}

export default function LifecycleTrendChart({ data }: LifecycleTrendChartProps) {
  const [yAxisMode, setYAxisMode] = useState<"count" | "duration">("count");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    () => new Set(data.clients.slice(0, 5))
  );

  const allMonths = useMemo(() => {
    const months = new Set<string>();
    for (const clientData of Object.values(data.byClient)) {
      for (const row of clientData) {
        months.add(row.month);
      }
    }
    return [...months].sort();
  }, [data.byClient]);

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  // Fixed color per client (by index in full clients list) so buttons match chart lines
  const getClientColor = (clientId: string) => {
    const idx = data.clients.indexOf(clientId);
    return CHART_COLORS[idx % CHART_COLORS.length];
  };

  const datasets = data.clients
    .filter((c) => selectedClients.has(c))
    .map((clientId) => {
      const clientRows = data.byClient[clientId] ?? [];
      const valueByMonth = new Map(clientRows.map((r) => [r.month, r]));
      const values = allMonths.map((m) => {
        const row = valueByMonth.get(m);
        if (!row) return 0;
        return yAxisMode === "count" ? row.count : row.duration / 3600;
      });
      const color = getClientColor(clientId);
      return {
        label: clientId,
        data: values,
        borderColor: color,
        backgroundColor: color + "15",
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      };
    });

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        grid: { color: "#e2e8f0" },
        border: { display: true, color: "#e2e8f0" },
        ticks: { color: "#94a3b8", font: CHART_FONT },
      },
      y: {
        grid: { color: "#e2e8f0" },
        border: { display: true, color: "#e2e8f0" },
        ticks: { color: "#94a3b8", font: CHART_FONT },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        titleColor: "#1e293b",
        bodyColor: "#64748b",
        titleFont: { ...CHART_FONT, size: 12, weight: "bold" },
        bodyFont: CHART_FONT,
        padding: 12,
        cornerRadius: 10,
      },
    },
    animation: { duration: 350 },
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Interactive Lifecycle Trend
        </h4>
        <DefinitionButton definition="Monthly trend of uploaded count or duration per client. Toggle Y-axis and select clients to compare." />
      </div>
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Y-axis:
          </span>
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setYAxisMode("count")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                yAxisMode === "count"
                  ? "bg-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Upload Count
            </button>
            <button
              type="button"
              onClick={() => setYAxisMode("duration")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                yAxisMode === "duration"
                  ? "bg-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Upload Duration
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Clients:
          </span>
          {data.clients.map((clientId) => {
            const color = getClientColor(clientId);
            const isSelected = selectedClients.has(clientId);
            return (
              <label
                key={clientId}
                className={`flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-md border cursor-pointer transition-all ${
                  isSelected
                    ? "border-current"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: color,
                        backgroundColor: color + "18",
                        color: color,
                      }
                    : undefined
                }
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleClient(clientId)}
                  className="h-3 w-3 rounded"
                  style={isSelected ? { accentColor: color } : undefined}
                />
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {clientId}
              </label>
            );
          })}
        </div>
      </div>
      <div className="h-[200px] sm:h-[240px]">
        {datasets.length > 0 ? (
          <Line
            data={{ labels: allMonths, datasets }}
            options={options}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Select at least one client to plot
          </div>
        )}
      </div>
    </div>
  );
}
