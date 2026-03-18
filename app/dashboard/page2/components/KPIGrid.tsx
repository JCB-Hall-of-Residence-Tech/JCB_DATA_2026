"use client";

import InsightTrigger from "@/components/InsightTrigger";
import type { KPIs } from "./types";

interface KPIGridProps {
  kpis: KPIs;
  page?: string;
  filters?: Record<string, string>;
}

interface KPITile {
  label: string;
  value: string;
  unit: string;
  direction: "up" | "down";
  sub: string;
  widgetId: string;
}

export default function KPIGrid({ kpis, page = "page2", filters = {} }: KPIGridProps) {
  const tiles: KPITile[] = [
    {
      label: "Publish Rate",
      value: String(kpis.publishRate),
      unit: "%",
      direction: kpis.publishRate >= 50 ? "up" : "down",
      sub: "Processed → Published",
      widgetId: "kpi_publish_rate",
    },
    {
      label: "Process Rate",
      value: String(kpis.processRate),
      unit: "%",
      direction: kpis.processRate >= 70 ? "up" : "down",
      sub: "Uploaded → Processed",
      widgetId: "kpi_process_rate",
    },
    {
      label: "Avg Duration",
      value: String(kpis.avgDuration),
      unit: " min",
      direction: "up",
      sub: "Per published video",
      widgetId: "kpi_avg_duration",
    },
    {
      label: "Drop Gap",
      value: kpis.dropGap.toLocaleString(),
      unit: "",
      direction: "down",
      sub: "Proc − Published count",
      widgetId: "kpi_drop_gap",
    },
    {
      label: "Total Uploaded",
      value: kpis.totalUploaded.toLocaleString(),
      unit: "",
      direction: "up",
      sub: "All uploaded videos",
      widgetId: "kpi_total_uploaded",
    },
    {
      label: "Total Published",
      value: kpis.totalPublished.toLocaleString(),
      unit: "",
      direction: kpis.totalPublished > 0 ? "up" : "down",
      sub: "Successfully published",
      widgetId: "kpi_total_published",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
        Performance KPIs
        <span className="flex-1 h-px bg-gray-100" />
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tiles.map((t) => (
          <InsightTrigger
            key={t.label}
            page={page}
            widget={t.widgetId}
            filters={filters}
            title={t.label}
            className="block"
          >
            <div
              className={`rounded-lg border p-3 transition-all hover:shadow-md cursor-pointer group ${
              t.direction === "up"
                ? "border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50"
                : "border-gray-100 hover:border-red-200 hover:bg-red-50/50"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {t.label}
            </div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">
              {t.value}
              {t.unit && (
                <span className="text-xs font-normal text-gray-400 ml-0.5">
                  {t.unit}
                </span>
              )}
            </div>
            <div
              className={`text-[11px] font-semibold mt-0.5 ${
                t.direction === "up" ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {t.direction === "up" ? "↑" : "↓"}{" "}
              {t.direction === "up" ? "Good" : "Needs attention"}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{t.sub}</div>
          </div>
          </InsightTrigger>
        ))}
      </div>
    </div>
  );
}
