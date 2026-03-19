"use client";

import type { KPIs } from "./types";
import { DefinitionButton } from "@/components/ui/DefinitionButton";
import { InsightButton } from "@/components/ui/InsightButton";

interface FunnelKPIsProps {
  kpis: KPIs;
}

export default function FunnelKPIs({ kpis }: FunnelKPIsProps) {
  const pubRate =
    kpis.totalUploaded > 0
      ? Math.round((kpis.totalPublished / kpis.totalUploaded) * 100)
      : 0;

  const items = [
    {
      label: "Uploaded",
      value: kpis.totalUploaded,
      color: "border-red-200 bg-red-50/50",
      textColor: "text-red-600",
      definition: "Total videos ingested into the system (uploaded count).",
    },
    {
      label: "Processed",
      value: kpis.totalProcessed,
      color: "border-amber-200 bg-amber-50/50",
      textColor: "text-amber-600",
      definition:
        "Total pieces of content processed by the AI pipeline (created outputs).",
    },
    {
      label: "Published",
      value: kpis.totalPublished,
      color: "border-emerald-200 bg-emerald-50/50",
      textColor: "text-emerald-600",
      definition: "Total videos that have been published to an output platform.",
    },
    {
      label: "Publish Rate",
      value: pubRate,
      suffix: "%",
      color:
        pubRate >= 30
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-red-200 bg-red-50/50",
      textColor: pubRate >= 30 ? "text-emerald-600" : "text-red-600",
      definition: "Published ÷ Uploaded × 100. Higher means more uploads reach publishing.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${item.color} relative`}
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {item.label}
            </div>
            <div className="flex items-center gap-1">
              <DefinitionButton definition={item.definition} />
              <InsightButton page="page2" widget={`funnel_kpi_${item.label.toLowerCase().replace(/\s+/g, "_")}`} title={`${item.label} insight`} />
            </div>
          </div>
          <div className={`text-xl font-bold mt-1 ${item.textColor}`}>
            {item.value.toLocaleString()}
            {"suffix" in item && item.suffix ? (
              <span className="text-sm">{item.suffix}</span>
            ) : (
              <span className="text-xs font-normal text-gray-400 ml-1">
                videos
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
