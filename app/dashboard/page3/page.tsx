"use client";

import { useEffect, useState } from "react";
import InsightTrigger from "@/components/InsightTrigger";
import {
  EfficiencyMatrix,
  SankeyFlow,
  ClientUserDrilldown,
  PlatformStackedChart,
  VelocityChart,
  type EfficiencyPoint,
  type SankeyNode,
  type SankeyLink,
  type ClientRank,
  type UserByClient,
  type VelocityRow,
} from "@/components/page3-charts";

type Page3Data = {
  efficiency: EfficiencyPoint[];
  sankey: { nodes: SankeyNode[]; links: SankeyLink[]; clientIds: string[] };
  clientRanking: ClientRank[];
  usersByClient: UserByClient[];
  stacked: { data: Record<string, string | number>[]; outputTypes: string[] };
  velocity: VelocityRow[];
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

        {/* Top row: Efficiency Matrix (left) + Client & User Performance (right) */}
        <div className="grid gap-4 lg:grid-cols-2">
          <InsightTrigger page="page3" widget="efficiency_matrix" filters={{}} title="Efficiency Matrix" className="block">
            <div style={{ height: 420 }}>
              <EfficiencyMatrix data={data.efficiency} />
            </div>
          </InsightTrigger>
          <InsightTrigger page="page3" widget="client_user_drilldown" filters={{}} title="Client & User Performance" className="block">
            <div style={{ height: 420 }}>
              <ClientUserDrilldown clients={data.clientRanking} users={data.usersByClient} />
            </div>
          </InsightTrigger>
        </div>

        {/* Middle row: Content Flow Network (full width) */}
        <InsightTrigger page="page3" widget="sankey_flow" filters={{}} title="Content Flow Network" className="block">
          <div style={{ minHeight: 460 }}>
            <SankeyFlow nodes={data.sankey.nodes} links={data.sankey.links} clientIds={data.sankey.clientIds} />
          </div>
        </InsightTrigger>

        {/* Bottom row: Platform Stacked + Velocity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <InsightTrigger page="page3" widget="platform_stacked" filters={{}} title="Platform × Output" className="block">
            <div style={{ height: 380 }}>
              <PlatformStackedChart
                data={data.stacked.data}
                outputTypes={data.stacked.outputTypes}
              />
            </div>
          </InsightTrigger>
          <InsightTrigger page="page3" widget="velocity_chart" filters={{}} title="Production Velocity" className="block">
            <div style={{ height: 380 }}>
              <VelocityChart data={data.velocity} />
            </div>
          </InsightTrigger>
        </div>
      </div>
    </div>
  );
}
