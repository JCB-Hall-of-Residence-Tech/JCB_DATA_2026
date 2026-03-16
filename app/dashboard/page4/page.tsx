"use client";

import { useEffect, useState } from "react";
import {
  KPIInsightCards,
  MonthlyContributionChart,
  ClientMomentumTracker,
  ClientShareDonut,
  AmplificationChart,
  PlatformHoursChart,
  FeatureAdoptionHeatmap,
  LanguageHeatmap,
  DataQualityMonitor,
  RiskTable,
  VideoExplorer,
  type Page4KPIs,
  type DataQuality,
  type ClientShare,
  type FeatureMatrix,
  type LanguageMatrix,
  type AmplificationRow,
  type PlatformHoursRow,
  type RiskRow,
  type VideoRow,
} from "@/components/page4-charts";

type Page4Data = {
  kpis: Page4KPIs;
  dataQuality: DataQuality;
  monthlyContribution: Record<string, string | number>[];
  clientIds: string[];
  clientShare: ClientShare[];
  featureMatrix: FeatureMatrix;
  amplification: AmplificationRow[];
  platformHours: PlatformHoursRow[];
  languageMatrix: LanguageMatrix;
  riskTable: RiskRow[];
  videoExplorer: VideoRow[];
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

      <div className="px-5 pb-8 space-y-4">
        {/* Row 1: KPI Insight Cards */}
        <KPIInsightCards kpis={data.kpis} />

        {/* Row 2: Usage Trends — Monthly Contribution | Growth Momentum | Client Share */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_2fr_3fr] gap-3" style={{ height: 340 }}>
          <MonthlyContributionChart data={data.monthlyContribution} clientIds={data.clientIds} />
          <ClientMomentumTracker data={data.monthlyContribution} clientIds={data.clientIds} />
          <ClientShareDonut data={data.clientShare} />
        </div>

        {/* Row 3: Content Amplification Factor | Language Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 340 }}>
          <AmplificationChart data={data.amplification} />
          <LanguageHeatmap matrix={data.languageMatrix} />
        </div>

        {/* Row 4: Data Quality Monitor | Published Duration by Platform */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 320 }}>
          <DataQualityMonitor dq={data.dataQuality} />
          <PlatformHoursChart data={data.platformHours} />
        </div>

        {/* Row 5: Feature Adoption Heatmap */}
        <FeatureAdoptionHeatmap matrix={data.featureMatrix} />

        {/* Row 7: Risk & Underperformance Table */}
        <RiskTable data={data.riskTable} />

        {/* Row 8: Video Explorer */}
        <VideoExplorer data={data.videoExplorer} />
      </div>
    </div>
  );
}
