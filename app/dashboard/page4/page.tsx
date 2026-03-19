"use client";

import { useEffect, useState } from "react";
import {
  KPIInsightCards,
  AmplificationChart,
  PlatformHoursChart,
  // DataQualityMonitor,
  // VideoExplorer,
  type Page4KPIs,
  type DataQuality,
  type AmplificationRow,
  type PlatformHoursRow,
  type VideoRow,
} from "@/components/page4-charts";
import {
  SankeyFlow,
  PlatformStackedChart,
  VelocityChart,
} from "@/components/page3-charts";

type Page4Data = {
  kpis: Page4KPIs;
  dataQuality: DataQuality;
  amplification: AmplificationRow[];
  platformHours: PlatformHoursRow[];
  platformHoursByClient?: { client_id: string; platform: string; hours: number }[];
  featureMatrix?: { clients: string[]; outputTypes: string[]; data: Record<string, Record<string, { created: number; published: number }>> };
  videoExplorer: VideoRow[];
  sankey: { nodes: { name: string }[]; links: { client_id: string; source: string; target: string; value: number; language: string }[]; clientIds: string[] };
  stacked: { data: Record<string, string | number>[]; outputTypes: string[] };
  velocity: { group_name: string; avg_hours: number; min_hours: number; max_hours: number; median_hours: number; q1_hours: number; q3_hours: number }[];
};

export default function Page4() {
  const [data, setData] = useState<Page4Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/page4", { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json() as Promise<Page4Data>;
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Page4 load failed", err);
          setError(err.message);
        }
      });
    return () => ctrl.abort();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠</div>
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-red-200 border-t-red-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading strategic hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <h1 className="text-base font-bold text-gray-900 tracking-tight">
          Strategic Growth &amp; Operations Hub
        </h1>
        <span className="text-[11px] font-semibold px-3 py-0.5 rounded-full bg-red-50 text-red-500">
          Page 4 / 5
        </span>
      </div>

      <div className="px-5 pb-8 space-y-6">
        {/* Row 1: KPI Insight Cards */}
        <KPIInsightCards kpis={data.kpis} />

        {/* Row 2: Content Amplification Factor | Published Duration by Platform (left-right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[360px] min-h-[320px]">
            <AmplificationChart data={data.amplification} featureMatrix={data.featureMatrix} />
          </div>
          <div className="h-[360px] min-h-[320px]">
            <PlatformHoursChart data={data.platformHours} platformHoursByClient={data.platformHoursByClient} />
          </div>
        </div>

        {/* Data Quality Monitor — commented out */}
        {/* <DataQualityMonitor dq={data.dataQuality} /> */}

        {/* Video Explorer — commented out */}
        {/* <VideoExplorer data={data.videoExplorer} /> */}

        {/* Row 4: Content Flow Network */}
        <div style={{ minHeight: 400 }}>
          <SankeyFlow nodes={data.sankey.nodes} links={data.sankey.links} clientIds={data.sankey.clientIds} />
        </div>

        {/* Row 5: Platform Publishing Mix | Production Velocity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: 380 }}>
          <PlatformStackedChart data={data.stacked.data} outputTypes={data.stacked.outputTypes} />
          <VelocityChart data={data.velocity} />
        </div>
      </div>
    </div>
  );
}
