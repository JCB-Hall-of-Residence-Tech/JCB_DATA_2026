"use client";

import type { PipelineStatsData } from "./types";
import { useMemo } from "react";

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

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Pipeline Stats
      </h4>
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
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
        <div className="rounded-lg border border-gray-200 bg-white p-4">
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
      </div>
    </div>
  );
}
