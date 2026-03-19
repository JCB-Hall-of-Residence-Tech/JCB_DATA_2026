"use client";

import { useState, Fragment } from "react";
import type { RiskRow } from "./types";
import { DefinitionButton } from "@/components/ui/DefinitionButton";

function riskLevel(row: RiskRow) {
  const publishRate = row.totalCreated === 0 ? 0 : (row.totalPublished / row.totalCreated) * 100;
  const dataIssues = row.unknownInput + row.pubNoPlatform + row.pubNoUrl;
  const featureGap = row.totalOutputTypes - row.outputTypesUsed;
  let score = 0;
  if (publishRate < 0.5) score += 3;
  else if (publishRate < 1) score += 2;
  else if (publishRate < 2) score += 1;
  if (dataIssues > 50) score += 2;
  else if (dataIssues > 10) score += 1;
  if (featureGap >= 3) score += 2;
  else if (featureGap >= 1) score += 1;
  if (score >= 5) return { label: "HIGH RISK", cls: "bg-rose-50 text-rose-700 border-rose-200" };
  if (score >= 3) return { label: "MODERATE", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "HEALTHY", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

interface RiskTableWithDrilldownProps {
  data: RiskRow[];
}

export default function RiskTableWithDrilldown({ data }: RiskTableWithDrilldownProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white via-rose-50/40 to-amber-50/40 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Client Risk & Underperformance Monitor
          </h3>
          <p className="text-[12px] text-gray-500 mt-1 max-w-xl">
            Spot at-risk accounts early. Each row combines publish rate, data quality gaps, and
            feature adoption into a single risk score.{" "}
            <span className="font-medium text-gray-600">
              Click any row to drill down into the details.
            </span>
          </p>
        </div>
        <DefinitionButton definition="Risk score combines: publish rate (published/created), data issues (unknown input, missing platform/URL), and feature gap (unused output types). HIGH RISK = urgent attention; MODERATE = monitor; HEALTHY = on track." />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Account</th>
              <th className="px-5 py-3.5">Processed Hrs</th>
              <th className="px-5 py-3.5">Published / Created</th>
              <th className="px-5 py-3.5">Publish Rate</th>
              <th className="px-5 py-3.5">Data Issues</th>
              <th className="px-5 py-3.5">Feature Gap</th>
              <th className="px-5 py-3.5 text-right">Risk Level</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {data.map((row) => {
              const rl = riskLevel(row);
              const pubRate =
                row.totalCreated === 0
                  ? 0
                  : Math.round((row.totalPublished / row.totalCreated) * 1000) / 10;
              const dataIssues = row.unknownInput + row.pubNoPlatform + row.pubNoUrl;
              const isExpanded = expandedId === row.client_id;

              return (
                <Fragment key={row.client_id}>
                  <tr
                    key={row.client_id}
                    onClick={() => setExpandedId(isExpanded ? null : row.client_id)}
                    className={`cursor-pointer transition-all ${
                      isExpanded ? "bg-rose-50/60" : "hover:bg-gray-50/80"
                    }`}
                  >
                    <td className="px-5 py-3.5 font-bold text-gray-800 flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          rl.label === "HIGH RISK"
                            ? "bg-rose-500"
                            : rl.label === "MODERATE"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      {row.client_id}
                      <span className="text-gray-400 text-xs font-normal">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-600">
                      {row.createdHours.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                      h
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <span className="font-semibold text-gray-800">
                        {row.totalPublished.toLocaleString()}
                      </span>
                      <span className="text-gray-400"> / </span>
                      {row.totalCreated.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pubRate >= 2 ? "bg-emerald-500" : pubRate >= 1 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.min(pubRate * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{pubRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {dataIssues > 0 ? (
                        <span className="text-xs font-semibold text-amber-600">
                          {dataIssues} issues
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-500 font-medium">Clean</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs font-medium">
                      {row.outputTypesUsed}/{row.totalOutputTypes} types
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full border ${rl.cls}`}
                      >
                        {rl.label}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${row.client_id}-detail`} className="bg-rose-50/40">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="rounded-xl border border-rose-100 bg-white p-4 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                            Account details — {row.client_id}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                Processed volume
                              </p>
                              <p className="font-bold text-gray-800 mt-0.5">
                                {row.createdHours.toLocaleString()}h
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {row.totalCreated.toLocaleString()} outputs created
                              </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                Publish funnel
                              </p>
                              <p className="font-bold text-gray-800 mt-0.5">
                                {row.totalPublished.toLocaleString()} /{" "}
                                {row.totalCreated.toLocaleString()} published
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {pubRate}% publish rate
                              </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                Data quality
                              </p>
                              <p className="font-bold text-gray-800 mt-0.5">
                                {dataIssues === 0 ? (
                                  <span className="text-emerald-600">Clean</span>
                                ) : (
                                  <span className="text-amber-600">{dataIssues} issues</span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {row.unknownInput} unknown input · {row.pubNoPlatform} no platform ·{" "}
                                {row.pubNoUrl} no URL
                              </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                Feature adoption
                              </p>
                              <p className="font-bold text-gray-800 mt-0.5">
                                {row.outputTypesUsed} / {row.totalOutputTypes} output types used
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {row.totalOutputTypes - row.outputTypesUsed} types not yet adopted
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-3 border-t border-gray-100 pt-3">
                            Risk level: <span className={`font-semibold ${rl.cls} px-1.5 py-0.5 rounded`}>{rl.label}</span>
                            {" — "}
                            {rl.label === "HIGH RISK"
                              ? "Low publish rate, data gaps, or limited feature use. Consider outreach."
                              : rl.label === "MODERATE"
                                ? "Some areas need improvement. Monitor trends."
                                : "Account is performing well across metrics."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
