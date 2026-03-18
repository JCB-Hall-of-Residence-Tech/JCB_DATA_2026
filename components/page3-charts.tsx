"use client";

import { useState } from "react";
import { DefinitionButton } from "@/components/ui/DefinitionButton";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  ZAxis,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EfficiencyPoint = {
  client_id: string;
  channel_name: string;
  created_count: number;
  published_count: number;
  publish_rate: number;
};

export type SankeyNode = { name: string };
export type SankeyLink = {
  client_id?: string;
  source: string;
  target: string;
  value: number;
  language?: string;
};

export type TornadoUser = {
  user_name: string;
  published_count: number;
  created_count: number;
  publish_rate: number;
};

export type ClientRank = {
  client_id: string;
  published_count: number;
  created_count: number;
  publish_rate: number;
};

export type UserByClient = {
  client_id: string;
  user_name: string;
  published_count: number;
  created_count: number;
  publish_rate: number;
};

export type StackedData = {
  data: Record<string, string | number>[];
  outputTypes: string[];
};

export type VelocityRow = {
  group_name: string;
  avg_hours: number;
  min_hours: number;
  max_hours: number;
  median_hours: number;
  q1_hours: number;
  q3_hours: number;
};

// ─── Color Palette ───────────────────────────────────────────────────────────

const PALETTE = [
  "#ef4444", "#f97316", "#facc15", "#22c55e", "#06b6d4",
  "#6366f1", "#ec4899", "#14b8a6", "#a855f7", "#f43f5e",
];

function rateColor(rate: number): string {
  if (rate >= 70) return "#22c55e";
  if (rate >= 40) return "#f97316";
  return "#ef4444";
}

// ─── 1. Efficiency Matrix (Scatter with client filter) ───────────────────────

function EfficiencyTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as EfficiencyPoint;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-zinc-900">{d.channel_name}</p>
      <p className="text-zinc-600">Client: {d.client_id}</p>
      <p className="text-zinc-600">Created: {d.created_count.toLocaleString()}</p>
      <p className="text-zinc-600">Published: {d.published_count.toLocaleString()}</p>
      <p className="font-medium text-zinc-800">Publish Rate: {d.publish_rate}%</p>
    </div>
  );
}

export function EfficiencyMatrix({ data }: { data: EfficiencyPoint[] }) {
  const [selectedClient, setSelectedClient] = useState<string>("all");

  const clientIds = Array.from(
    new Set(data.map((d) => d.client_id).filter((id): id is string => !!id))
  ).sort();

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-red-100 bg-white/70 p-4">
        <p className="text-sm text-zinc-500">No channel data</p>
      </div>
    );
  }

  const filtered = selectedClient === "all"
    ? data
    : data.filter((d) => d.client_id === selectedClient);

  return (
    <div className="flex h-full flex-col rounded-xl border border-red-100 bg-white/70 p-4 shadow-sm shadow-red-50">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Efficiency Matrix</h3>
            <p className="text-xs text-zinc-500">
              Created vs Published per channel — {filtered.length} channel{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <DefinitionButton definition="Scatter plot of created count (x) vs published count (y) per channel. Higher publish rate = better efficiency. Filter by client." />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setSelectedClient("all")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              selectedClient === "all"
                ? "bg-red-600 text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-red-50"
            }`}
          >
            All
          </button>
          {clientIds.map((id, i) => {
            const color = PALETTE[i % PALETTE.length];
            const isSelected = selectedClient === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedClient(id)}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border"
                style={
                  isSelected
                    ? { backgroundColor: color, color: "#fff", borderColor: color }
                    : { borderColor: "#e4e4e7", backgroundColor: "#fff", color: "#71717a" }
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? "#fff" : color }}
                />
                {id}
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1" style={{ minHeight: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
            <XAxis
              dataKey="created_count"
              name="Created"
              type="number"
              tick={{ fontSize: 10 }}
              domain={[0, "dataMax"]}
              label={{ value: "Created Count", position: "insideBottom", offset: -8, fontSize: 10, fill: "#71717a" }}
            />
            <YAxis
              dataKey="published_count"
              name="Published"
              type="number"
              tick={{ fontSize: 10 }}
              domain={[0, "dataMax"]}
              label={{ value: "Published Count", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#71717a" }}
            />
            <ZAxis dataKey="created_count" range={[60, 400]} />
            <Tooltip content={<EfficiencyTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            {selectedClient === "all"
              ? clientIds.map((id, i) => {
                  const clientData = filtered.filter((d) => d.client_id === id);
                  return (
                    <Scatter
                      key={id}
                      data={clientData}
                      shape="circle"
                      fill={PALETTE[i % PALETTE.length]}
                      fillOpacity={0.65}
                    />
                  );
                })
              : <Scatter data={filtered} shape="circle" fill={PALETTE[clientIds.indexOf(selectedClient) % PALETTE.length]} fillOpacity={0.65} />}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 2. Content Flow Network ─────────────────────────────────────────────────

type SankeyProps = {
  nodes: SankeyNode[];
  links: SankeyLink[];
  clientIds?: string[];
};

type FlowLayer = "input" | "channel" | "output";

function classifyNodes(links: SankeyLink[]) {
  const asSource = new Set(links.map((l) => l.source));
  const asTarget = new Set(links.map((l) => l.target));
  const channels = new Set<string>();
  for (const n of asSource) if (asTarget.has(n)) channels.add(n);
  for (const n of asTarget) if (asSource.has(n)) channels.add(n);

  const inputs = new Set<string>();
  const outputs = new Set<string>();
  for (const l of links) {
    if (!channels.has(l.source)) inputs.add(l.source);
    if (!channels.has(l.target)) outputs.add(l.target);
  }
  return { inputs: Array.from(inputs), channels: Array.from(channels), outputs: Array.from(outputs) };
}

const LAYER_COLORS: Record<FlowLayer, string> = {
  input: "#ef4444",
  channel: "#6366f1",
  output: "#22c55e",
};

function aggregateLinks(links: SankeyLink[]): SankeyLink[] {
  const map = new Map<string, number>();
  for (const l of links) {
    const key = `${l.source}|||${l.target}`;
    map.set(key, (map.get(key) ?? 0) + l.value);
  }
  return Array.from(map.entries())
    .map(([key, value]) => {
      const [source, target] = key.split("|||");
      return { source, target, value };
    })
    .sort((a, b) => b.value - a.value);
}

function CollapsibleColumn({
  label,
  color,
  count,
  collapsed,
  onToggle,
  borderRight,
  children,
}: {
  label: string;
  color: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  borderRight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col px-2.5 py-3 transition-all duration-200 ${collapsed ? "w-20 shrink-0" : "min-w-[180px] flex-1"}`}
      style={{ borderRight: borderRight ? "1px solid #e5e7eb" : undefined }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full shrink-0 items-center gap-1.5 px-1 text-left hover:opacity-80"
      >
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${collapsed ? "" : "rotate-90"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400">{count}</span>
      </button>
      {!collapsed && (
        <div className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] content-start gap-1.5 overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
}

export function SankeyFlow({ nodes, links, clientIds: propClientIds }: SankeyProps) {
  const [selected, setSelected] = useState<{ name: string; layer: FlowLayer } | null>(null);
  const [clientFilter, setClientFilter] = useState<string[]>(["all"]);
  const [languageFilter, setLanguageFilter] = useState<string[]>(["all"]);
  // Expanded by default (not collapsed)
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [channelsCollapsed, setChannelsCollapsed] = useState(false);
  const [outputsCollapsed, setOutputsCollapsed] = useState(false);

  if (links.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-red-100 bg-white/70 p-4 shadow-sm">
        <p className="text-sm text-zinc-500">No flow data available</p>
      </div>
    );
  }

  const allClientIds = propClientIds && propClientIds.length > 0
    ? propClientIds
    : Array.from(new Set(links.map((l) => l.client_id).filter((id): id is string => !!id))).sort();

  const allLanguages = Array.from(
    new Set(
      links
        .map((l) => l.language)
        .filter((lng): lng is string => !!lng && lng !== "Unknown")
    )
  ).sort();

  const filteredRawLinks = links.filter((l) => {
    const clientOk =
      clientFilter.includes("all") ||
      (l.client_id && clientFilter.includes(l.client_id));
    const langOk =
      languageFilter.includes("all") ||
      (l.language && languageFilter.includes(l.language));
    return clientOk && langOk;
  });

  const activeLinks = aggregateLinks(filteredRawLinks);

  const { inputs, channels, outputs } = classifyNodes(activeLinks);

  const inputToChannel = activeLinks.filter((l) => inputs.includes(l.source) && channels.includes(l.target));
  const channelToOutput = activeLinks.filter((l) => channels.includes(l.source) && outputs.includes(l.target));

  const totalByNode = (name: string) =>
    activeLinks.filter((l) => l.source === name || l.target === name).reduce((s, l) => s + l.value, 0);

  const sortedInputs = [...inputs].sort((a, b) => totalByNode(b) - totalByNode(a));
  const sortedChannels = [...channels].sort((a, b) => totalByNode(b) - totalByNode(a));
  const sortedOutputs = [...outputs].sort((a, b) => totalByNode(b) - totalByNode(a));

  type ConnRow = { label: string; value: number; color: string; isIncoming: boolean };
  let incomingRows: ConnRow[] = [];
  let outgoingRows: ConnRow[] = [];

  if (selected) {
    if (selected.layer === "input") {
      outgoingRows = inputToChannel
        .filter((l) => l.source === selected.name)
        .sort((a, b) => b.value - a.value)
        .map((l) => ({ label: l.target, value: l.value, color: LAYER_COLORS.channel, isIncoming: false }));
    } else if (selected.layer === "channel") {
      incomingRows = inputToChannel
        .filter((l) => l.target === selected.name)
        .sort((a, b) => b.value - a.value)
        .map((l) => ({ label: l.source, value: l.value, color: LAYER_COLORS.input, isIncoming: true }));
      outgoingRows = channelToOutput
        .filter((l) => l.source === selected.name)
        .sort((a, b) => b.value - a.value)
        .map((l) => ({ label: l.target, value: l.value, color: LAYER_COLORS.output, isIncoming: false }));
    } else {
      incomingRows = channelToOutput
        .filter((l) => l.target === selected.name)
        .sort((a, b) => b.value - a.value)
        .map((l) => ({ label: l.source, value: l.value, color: LAYER_COLORS.channel, isIncoming: true }));
    }
  }

  const allConnRows = [...incomingRows, ...outgoingRows];
  const totalSelected = allConnRows.reduce((s, r) => s + r.value, 0);
  const maxIncoming = incomingRows[0]?.value || 1;
  const maxOutgoing = outgoingRows[0]?.value || 1;

  const connBar = (row: ConnRow, i: number, maxV: number) => (
    <div key={i} className="flex items-center gap-2 py-1">
      <span className="w-4 shrink-0 text-center text-[10px] font-bold text-zinc-400">
        {row.isIncoming ? "←" : "→"}
      </span>
      <span className="w-28 shrink-0 truncate text-xs font-medium text-zinc-800">{row.label}</span>
      <div className="min-w-0 flex-1 overflow-hidden rounded bg-zinc-100">
        <div
          className="h-4 rounded"
          style={{
            width: `${Math.max((row.value / maxV) * 100, 2)}%`,
            backgroundColor: row.color,
            opacity: 0.65,
          }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-xs tabular-nums font-semibold text-zinc-700">
        {row.value.toLocaleString()}
      </span>
    </div>
  );

  const pill = (name: string, layer: FlowLayer) => {
    const isActive = selected?.name === name && selected?.layer === layer;
    const vol = totalByNode(name);
    const maxVol = Math.max(
      ...(layer === "input" ? sortedInputs : layer === "channel" ? sortedChannels : sortedOutputs).map(totalByNode),
      1
    );
    const barPct = (vol / maxVol) * 100;

    return (
      <button
        key={name}
        type="button"
        onClick={() => setSelected(isActive ? null : { name, layer })}
        className={`relative flex w-full items-center gap-2 overflow-hidden rounded-lg border px-3 py-2 text-left transition-all ${
          isActive
            ? "border-transparent shadow-sm ring-2 ring-offset-1"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
        }`}
        style={isActive ? { backgroundColor: LAYER_COLORS[layer], "--tw-ring-color": LAYER_COLORS[layer] } as React.CSSProperties : {}}
      >
        {!isActive && (
          <div
            className="absolute inset-y-0 left-0 rounded-lg opacity-10"
            style={{ width: `${barPct}%`, backgroundColor: LAYER_COLORS[layer] }}
          />
        )}
        <span
          className={`relative h-2.5 w-2.5 shrink-0 rounded-full ${isActive ? "bg-white" : ""}`}
          style={isActive ? {} : { backgroundColor: LAYER_COLORS[layer] }}
        />
        <span className={`relative flex-1 truncate text-xs font-semibold ${isActive ? "text-white" : "text-zinc-800"}`}>
          {name}
        </span>
        <span className={`relative text-[11px] tabular-nums font-medium ${isActive ? "text-white/80" : "text-zinc-500"}`}>
          {vol.toLocaleString()}
        </span>
      </button>
    );
  };

  const totalVideos = activeLinks.reduce((s, l) => s + l.value, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-red-100 bg-white/70 shadow-sm shadow-red-50">
      {/* Header */}
      <div className="shrink-0 border-b border-red-100/60">
        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-start gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Content Flow Network</h3>
              <p className="text-xs text-zinc-500">
                {selected
                  ? `Connections for "${selected.name}"`
                  : "Select any node to explore its connections"}
              </p>
            </div>
            <DefinitionButton definition="Sankey-style flow: Input types → Channels → Output types. Click a node to see incoming/outgoing connections. Filter by client." />
          </div>
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
            >
              ✕ Clear
            </button>
          )}
        </div>
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto border-t border-zinc-100 px-5 py-2 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="shrink-0 font-semibold uppercase tracking-wider text-zinc-400">
              Client:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setClientFilter(["all"]);
                  setSelected(null);
                }}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  clientFilter.includes("all")
                    ? "bg-red-600 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-red-50"
                }`}
              >
                All
              </button>
              {allClientIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setClientFilter((prev) => {
                      if (prev.includes("all")) {
                        return [id];
                      }
                      if (prev.includes(id)) {
                        const next = prev.filter((v) => v !== id);
                        return next.length === 0 ? ["all"] : next;
                      }
                      return [...prev, id];
                    });
                  }}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    clientFilter.includes(id)
                      ? "bg-red-600 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-red-50"
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
          {allLanguages.length > 0 && (
            <div className="ml-auto flex items-center gap-1">
              <span className="shrink-0 font-semibold uppercase tracking-wider text-zinc-400">
                Language:
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setLanguageFilter(["all"]);
                    setSelected(null);
                  }}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    languageFilter.includes("all")
                      ? "bg-red-600 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-red-50"
                  }`}
                >
                  All
                </button>
                {allLanguages.map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => {
                      setSelected(null);
                      setLanguageFilter((prev) => {
                        if (prev.includes("all")) {
                          return [lng];
                        }
                        if (prev.includes(lng)) {
                          const next = prev.filter((v) => v !== lng);
                          return next.length === 0 ? ["all"] : next;
                        }
                        return [...prev, lng];
                      });
                    }}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      languageFilter.includes(lng)
                        ? "bg-red-600 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:bg-red-50"
                    }`}
                  >
                    {lng}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Three node columns */}
        <div
          className="flex shrink-0 gap-0"
          style={{ width: selected ? "38%" : "100%", transition: "width 0.2s" }}
        >
          <CollapsibleColumn
            label="Inputs"
            color={LAYER_COLORS.input}
            count={sortedInputs.length}
            collapsed={inputsCollapsed}
            onToggle={() => setInputsCollapsed((v) => !v)}
          >
            {sortedInputs.map((n) => pill(n, "input"))}
          </CollapsibleColumn>
          <CollapsibleColumn
            label="Channels"
            color={LAYER_COLORS.channel}
            count={sortedChannels.length}
            collapsed={channelsCollapsed}
            onToggle={() => setChannelsCollapsed((v) => !v)}
            borderRight
          >
            {sortedChannels.map((n) => pill(n, "channel"))}
          </CollapsibleColumn>
          <CollapsibleColumn
            label="Outputs"
            color={LAYER_COLORS.output}
            count={sortedOutputs.length}
            collapsed={outputsCollapsed}
            onToggle={() => setOutputsCollapsed((v) => !v)}
            borderRight={!!selected}
          >
            {sortedOutputs.map((n) => pill(n, "output"))}
          </CollapsibleColumn>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="flex-1 overflow-y-auto bg-zinc-50/40 px-5 py-3">
            <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="rounded-lg px-3 py-1.5 text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: LAYER_COLORS[selected.layer] }}
                >
                  {selected.name}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {selected.layer} type
                </span>
              </div>
              <div className="mt-3 flex gap-6 text-xs text-zinc-600">
                <span><strong className="text-lg text-zinc-900">{totalSelected.toLocaleString()}</strong> videos</span>
                <span><strong className="text-lg text-zinc-900">{allConnRows.length}</strong> connections</span>
              </div>
            </div>

            {incomingRows.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <span className="text-base">←</span> Receives from
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400">{incomingRows.length}</span>
                </p>
                <div className="space-y-0.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
                  {incomingRows.map((r, i) => connBar(r, i, maxIncoming))}
                </div>
              </div>
            )}

            {outgoingRows.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <span className="text-base">→</span> Sends to
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400">{outgoingRows.length}</span>
                </p>
                <div className="space-y-0.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
                  {outgoingRows.map((r, i) => connBar(r, i, maxOutgoing))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center gap-5 border-t border-zinc-100 px-5 py-2.5 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LAYER_COLORS.input }} /> Input
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LAYER_COLORS.channel }} /> Channel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LAYER_COLORS.output }} /> Output
        </span>
        <span className="ml-auto font-medium text-zinc-400">
          {!clientFilter.includes("all") && clientFilter.length > 0 && (
            <span className="mr-2 text-red-500">
              {clientFilter.join(", ")}
            </span>
          )}
          {activeLinks.length} connections · {totalVideos.toLocaleString()} videos
        </span>
      </div>
    </div>
  );
}

// ─── 3. Client → User Drilldown Performance ─────────────────────────────────

type FilterMode = "all" | "top10" | "bottom10";

function RankRow({
  rank,
  name,
  published,
  created,
  rate,
  isExpanded,
  onClick,
  isClient,
}: {
  rank: number;
  name: string;
  published: number;
  created: number;
  rate: number;
  isExpanded?: boolean;
  onClick?: () => void;
  isClient?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isClient
          ? "cursor-pointer hover:bg-red-50/80 " + (isExpanded ? "bg-red-50/60" : "bg-white")
          : "ml-6 bg-zinc-50/80"
      }`}
      onClick={onClick}
    >
      <span className="w-6 shrink-0 text-right text-xs font-semibold text-zinc-400">#{rank}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isClient && (
            <svg
              className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
          <span className={`truncate text-sm ${isClient ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"}`}>
            {name}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="w-24">
          <div className="flex items-center gap-1.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(rate, 100)}%`,
                  backgroundColor: rateColor(rate),
                }}
              />
            </div>
            <span className="w-10 text-right text-[10px] font-medium" style={{ color: rateColor(rate) }}>
              {rate}%
            </span>
          </div>
        </div>
        <span className="w-16 text-right text-xs tabular-nums text-zinc-600">
          {published.toLocaleString()}
        </span>
        <span className="w-16 text-right text-xs tabular-nums text-zinc-400">
          {created.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function ClientUserDrilldown({
  clients,
  users,
}: {
  clients: ClientRank[];
  users: UserByClient[];
}) {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  if (clients.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-red-100 bg-white/70 p-4">
        <p className="text-sm text-zinc-500">No client data</p>
      </div>
    );
  }

  const sortedClients = [...clients].sort((a, b) => b.published_count - a.published_count);

  let displayClients: ClientRank[];
  if (filter === "top10") {
    displayClients = sortedClients.slice(0, 10);
  } else if (filter === "bottom10") {
    displayClients = sortedClients.slice(-10);
  } else {
    displayClients = sortedClients;
  }

  const usersForClient = (clientId: string) => {
    const clientUsers = users
      .filter((u) => u.client_id === clientId)
      .sort((a, b) => b.published_count - a.published_count);
    if (filter === "top10") return clientUsers.slice(0, 10);
    if (filter === "bottom10") return clientUsers.slice(-10);
    return clientUsers;
  };

  const filterBtn = (mode: FilterMode, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(mode)}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        filter === mode
          ? "bg-red-600 text-white"
          : "text-zinc-500 hover:bg-red-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-red-100 bg-white/70 shadow-sm shadow-red-50">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-red-100/60 px-4 py-3">
        <div className="flex items-start gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Client & User Performance</h3>
            <p className="text-xs text-zinc-500">
              Ranked by published count — click a client to drill into its users
            </p>
          </div>
          <DefinitionButton definition="Client ranking by published count with publish rate. Expand a client to see its users. Filter: All, Top 10, or Bottom 10." />
        </div>
        <div className="flex gap-1 rounded-full border border-red-100 bg-white/80 px-1 py-0.5 shadow-sm">
          {filterBtn("all", "All")}
          {filterBtn("top10", "Top 10")}
          {filterBtn("bottom10", "Bottom 10")}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
        <span className="w-6 text-right">#</span>
        <span className="flex-1">Name</span>
        <span className="w-24 text-center">Efficiency</span>
        <span className="w-16 text-right">Published</span>
        <span className="w-16 text-right">Created</span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-1 py-1" style={{ maxHeight: 500 }}>
        <div className="space-y-0.5">
          {displayClients.map((c, ci) => {
            const isExpanded = expandedClient === c.client_id;
            const cUsers = isExpanded ? usersForClient(c.client_id) : [];
            return (
              <div key={c.client_id}>
                <RankRow
                  rank={ci + 1}
                  name={c.client_id}
                  published={c.published_count}
                  created={c.created_count}
                  rate={c.publish_rate}
                  isExpanded={isExpanded}
                  isClient
                  onClick={() =>
                    setExpandedClient(isExpanded ? null : c.client_id)
                  }
                />
                {isExpanded && cUsers.length > 0 && (
                  <div className="ml-2 space-y-0.5 border-l-2 border-red-100 py-1">
                    {cUsers.map((u, ui) => (
                      <RankRow
                        key={u.user_name}
                        rank={ui + 1}
                        name={u.user_name}
                        published={u.published_count}
                        created={u.created_count}
                        rate={u.publish_rate}
                      />
                    ))}
                  </div>
                )}
                {isExpanded && cUsers.length === 0 && (
                  <p className="ml-10 py-2 text-xs text-zinc-400">No users for this client</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex shrink-0 flex-wrap gap-4 border-t border-zinc-100 px-4 py-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> ≥70% efficiency</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-orange-500" /> 40–70%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" /> &lt;40% (needs training)</span>
        <span className="ml-auto text-zinc-400">{clients.length} clients · {users.length} users total</span>
      </div>
    </div>
  );
}

// ─── 4. Platform Publishing Distribution (100% Stacked) ──────────────────────

export function PlatformStackedChart({
  data,
  outputTypes,
}: {
  data: Record<string, string | number>[];
  outputTypes: string[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-red-100 bg-white/70 p-4">
        <p className="text-sm text-zinc-500">No platform data</p>
      </div>
    );
  }

  const pctData = data.map((row) => {
    const total = outputTypes.reduce((s, k) => s + (Number(row[k]) || 0), 0);
    const newRow: Record<string, string | number> = { platform: row.platform };
    for (const ot of outputTypes) {
      newRow[ot] = total > 0 ? +((Number(row[ot]) || 0) / total * 100).toFixed(1) : 0;
    }
    newRow._total = total;
    return newRow;
  });

  return (
    <div className="flex h-full flex-col rounded-xl border border-red-100 bg-white/70 p-4 shadow-sm shadow-red-50">
      <div className="mb-3 shrink-0 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Platform Publishing Mix</h3>
          <p className="text-xs text-zinc-500">
            Content type distribution per platform (% of published videos)
          </p>
        </div>
        <DefinitionButton definition="100% stacked bar chart: share of each output type per platform. Shows which formats dominate each platform." />
      </div>
      <div className="min-h-0 flex-1" style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pctData} stackOffset="none" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
            <XAxis dataKey="platform" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {outputTypes.map((ot, i) => (
              <Bar
                key={ot}
                dataKey={ot}
                stackId="stack"
                fill={PALETTE[i % PALETTE.length]}
                name={ot}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 5. Production Velocity (Box Plot via stacked bars) ──────────────────────

function VelocityTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as VelocityRow & { iqr_base: number; iqr_range: number };
  if (!d) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-zinc-900">{d.group_name}</p>
      <p className="text-zinc-600">Min: {d.min_hours}h</p>
      <p className="text-zinc-600">Q1: {d.q1_hours}h</p>
      <p className="text-zinc-600">Median: {d.median_hours}h</p>
      <p className="text-zinc-600">Q3: {d.q3_hours}h</p>
      <p className="text-zinc-600">Max: {d.max_hours}h</p>
      <p className="font-medium text-red-600">Avg: {d.avg_hours}h</p>
    </div>
  );
}

export function VelocityChart({ data }: { data: VelocityRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-red-100 bg-white/70 p-4">
        <p className="text-sm text-zinc-500">No velocity data</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    iqr_base: d.q1_hours,
    iqr_range: Math.max(d.q3_hours - d.q1_hours, 0.1),
  }));

  return (
    <div className="flex h-full flex-col rounded-xl border border-red-100 bg-white/70 p-4 shadow-sm shadow-red-50">
      <div className="mb-3 shrink-0 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Production Velocity</h3>
          <p className="text-xs text-zinc-500">
            Upload → Publish turnaround (hours) per platform — hover for details
          </p>
        </div>
        <DefinitionButton definition="Box-plot style: min, Q1, median, Q3, max hours from upload to publish per platform. IQR = interquartile range." />
      </div>
      <div className="min-h-0 flex-1" style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10 }}
              label={{ value: "Hours", position: "insideBottom", offset: -2, fontSize: 10 }}
            />
            <YAxis type="category" dataKey="group_name" tick={{ fontSize: 10 }} width={90} />
            <Tooltip content={<VelocityTooltip />} />
            <Bar dataKey="iqr_base" stackId="box" fill="transparent" barSize={16} />
            <Bar dataKey="iqr_range" stackId="box" fill="#ef4444" fillOpacity={0.6} barSize={16} radius={[2, 2, 2, 2]} name="IQR" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex shrink-0 flex-wrap gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-red-400/60" /> IQR (Q1–Q3)
        </span>
        <span>Hover for full distribution</span>
      </div>
    </div>
  );
}
