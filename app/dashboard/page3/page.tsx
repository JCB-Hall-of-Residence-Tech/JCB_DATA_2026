"use client";

import { useEffect, useState } from "react";
import {
  EfficiencyMatrix,
  ClientUserDrilldown,
  type EfficiencyPoint,
  type ClientRank,
  type UserByClient,
} from "@/components/page3-charts";
import {
  MonthlyContributionChart,
  ClientMomentumTracker,
  ClientShareDonut,
  LanguageHeatmap,
  type ClientShare,
  type LanguageMatrix,
} from "@/components/page4-charts";

type Page3Data = {
  efficiency: EfficiencyPoint[];
  clientRanking: ClientRank[];
  usersByClient: UserByClient[];
  monthlyContribution: Record<string, string | number>[];
  clientIds: string[];
  clientShare: ClientShare[];
  languageMatrix: LanguageMatrix;
};

export default function Page3() {
  const [data, setData] = useState<Page3Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/page3", { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json() as Promise<Page3Data>;
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Page3 load failed", err);
          setError(err.message);
        }
      });
    return () => ctrl.abort();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-zinc-50 px-4">
        <p className="text-sm text-red-600">Failed to load data: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-zinc-50 px-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading analytics…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <header className="border-b border-red-100 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Operational Efficiency & Content Flow
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Channel efficiency, content transformation, user performance, platform mix, and production speed.
          </p>
        </header>

        {/* Row 1: Efficiency Matrix (left) + Client & User Performance (right) */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div style={{ height: 420 }}>
            <EfficiencyMatrix data={data.efficiency} />
          </div>
          <div style={{ height: 420 }}>
            <ClientUserDrilldown clients={data.clientRanking} users={data.usersByClient} />
          </div>
        </div>

        {/* Row 2: Monthly Billing | Growth Momentum | Client Share */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_2fr_3fr] gap-4" style={{ minHeight: 340 }}>
          <MonthlyContributionChart data={data.monthlyContribution} clientIds={data.clientIds} />
          <ClientMomentumTracker data={data.monthlyContribution} clientIds={data.clientIds} />
          <ClientShareDonut
            data={data.clientShare}
            languageMatrix={data.languageMatrix}
            monthlyContribution={data.monthlyContribution}
            clientIds={data.clientIds}
          />
        </div>

        {/* Row 3: Language Coverage by Client */}
        <div style={{ minHeight: 340 }}>
          <LanguageHeatmap matrix={data.languageMatrix} />
        </div>
      </div>
    </div>
  );
}
