"use client";

import type { DataHealthAlert } from "./types";

interface DataHealthTableProps {
  alerts: DataHealthAlert[];
}

export default function DataHealthTable({ alerts }: DataHealthTableProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Data Health Alert Board
        </h4>
        <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
          No data quality gaps found
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Data Health Alert Board
      </h4>
      <p className="text-[10px] text-gray-500 mb-3">
        Published videos with missing platform or user data
      </p>
      <div className="overflow-x-auto rounded-lg border border-red-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-red-100 bg-red-50/50">
              <th className="px-3 py-2 text-left font-semibold text-gray-700">
                Video ID
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">
                Headline
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">
                Platform
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">
                User ID
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">
                Issue
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.slice(0, 50).map((row, i) => (
              <tr
                key={row.video_id}
                className={`border-b border-gray-200 ${
                  i % 2 === 0 ? "bg-white" : "bg-red-50/30"
                }`}
              >
                <td className="px-3 py-2 font-mono text-gray-700">
                  {row.video_id}
                </td>
                <td className="px-3 py-2 max-w-[180px] truncate" title={row.headline}>
                  {row.headline}
                </td>
                <td className="px-3 py-2 text-gray-600">{row.published_platform}</td>
                <td className="px-3 py-2 text-gray-600">{row.user_id}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    {row.issue_type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length > 50 && (
          <div className="border-t border-gray-200 px-3 py-2 text-[10px] text-gray-500">
            + {alerts.length - 50} more rows
          </div>
        )}
      </div>
    </div>
  );
}
