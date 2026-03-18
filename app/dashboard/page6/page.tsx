"use client";

import { useEffect, useState } from "react";
import {
  SankeyFlow,
  type SankeyNode,
  type SankeyLink,
} from "@/components/page3-charts";

type Page6Data = {
  clients: string[];
  sankey: {
    nodes: SankeyNode[];
    links: SankeyLink[];
    clientIds: string[];
  };
};

export default function Page6() {
  const [data, setData] = useState<Page6Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedClient !== "all") params.set("client", selectedClient);
        const res = await fetch(`/api/page6?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load topology");
        }
        const json = (await res.json()) as Page6Data;
        setData(json);
        setError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Page6 load failed", err);
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [selectedClient]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-zinc-50 px-4">
        <p className="text-sm text-red-600">Failed to load topology: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-zinc-50 px-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Loading client topology…
        </div>
      </div>
    );
  }

  const clientOptions = data.clients;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <header className="border-b border-red-100 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Client → Channel → User → Language Topology
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Explore how each client fans out into channels, users, and
              languages, and how work flows across that structure.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Client Scope
            </span>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm focus:border-red-400 focus:outline-none"
            >
              <option value="all">All clients</option>
              {clientOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            {loading && (
              <span className="ml-1 text-[11px] text-zinc-400">
                Refreshing…
              </span>
            )}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
          <div style={{ height: 520 }}>
            <SankeyFlow
              nodes={data.sankey.nodes}
              links={data.sankey.links}
              clientIds={data.sankey.clientIds}
            />
          </div>

          <div className="flex h-full flex-col rounded-xl border border-red-100 bg-white/80 p-4 shadow-sm shadow-red-50">
            <h2 className="mb-1 text-sm font-semibold text-zinc-900">
              Structure Overview
            </h2>
            <p className="mb-3 text-xs text-zinc-500">
              This view treats users as inputs, channels as hubs, and languages
              as outputs. It helps you see whether work is concentrated on a
              few channels, whether certain users dominate, and which languages
              are actually used.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li>
                <span className="font-semibold text-zinc-800">Users → Channels</span>{" "}
                show who is actively creating within each workspace.
              </li>
              <li>
                <span className="font-semibold text-zinc-800">Channels → Languages</span>{" "}
                highlight localization and language fragmentation per channel.
              </li>
              <li>
                Use the <span className="font-semibold">client scope</span> and the
                filters inside the network panel to zoom into a single client or
                compare patterns across clients.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

