"use client";

import type { PipelineStatsData } from "./types";
import { useMemo } from "react";
import { DefinitionButton } from "@/components/ui/DefinitionButton";

interface PipelineStatsProps {
  data: PipelineStatsData;
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-8 text-red-500"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function PipelineStats({ data }: PipelineStatsProps) {
  const uploadedValues = useMemo(
    () => data.monthly.map((m) => m.uploaded),
    [data.monthly]
  );
  const createdValues = useMemo(
    () => data.monthly.map((m) => m.created),
    [data.monthly]
  );
  const publishedValues = useMemo(
    () => data.monthly.map((m) => m.published ?? 0),
    [data.monthly]
  );

  const totalPublishedSafe =
    data.totalPublished ??
    publishedValues.reduce((sum, v) => sum + (v || 0), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Pipeline Stats
        </h4>
        <DefinitionButton definition="Total uploaded count (videos ingested) and total processed count (AI-generated outputs). Sparklines show monthly trend." />
      </div>
      <div className="space-y-4">
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-red-300 hover:shadow-sm"
          onClick={() => {
            window.location.href = "/dashboard/page2";
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Total Uploaded Count
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {data.totalUploaded.toLocaleString()}
          </div>
          <div className="mt-2 h-10">
            <MiniSparkline values={uploadedValues} />
          </div>
        </div>
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-red-300 hover:shadow-sm"
          onClick={() => {
            window.location.href = "/dashboard/page2";
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Total Processed Count
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {data.totalProcessed.toLocaleString()}
          </div>
          <div className="mt-2 h-10">
            <MiniSparkline values={createdValues} />
          </div>
        </div>
        <div
          className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-red-300 hover:shadow-sm"
          onClick={() => {
            window.location.href = "/dashboard/page2";
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Total Published Count
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {totalPublishedSafe.toLocaleString()}
          </div>
          <div className="mt-2 h-10">
            <MiniSparkline values={publishedValues} />
          </div>
        </div>
      </div>
    </div>
  );
}
