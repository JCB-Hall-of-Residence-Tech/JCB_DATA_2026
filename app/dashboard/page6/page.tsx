"use client";

import { useState, useCallback } from "react";

type KPIResult = {
  id: string;
  label: string;
  value: string | null;
  rawValue?: unknown;
  format: string;
  description?: string;
  /** For breakdown KPIs (e.g. per channel) */
  rows?: { label: string; value: string }[];
};

type Suggestion = {
  id: string;
  label: string;
  keywords: string[];
  description?: string;
};

export default function Page6() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [kpi, setKpi] = useState<KPIResult | null>(null);
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [availableKPIs, setAvailableKPIs] = useState<Suggestion[]>([]);

  const fetchAvailableKPIs = useCallback(async () => {
    try {
      const res = await fetch("/api/page6");
      if (res.ok) {
        const json = await res.json();
        setAvailableKPIs(json.available ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setKpi(null);
    setGeneratedSql(null);
    setSuggestions(null);

    try {
      const res = await fetch("/api/page6", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kpiDefinition: trimmed }),
      });
      const json = await res.json();

      if (!res.ok) {
        const msg = json.error ?? "Failed to create KPI";
        const details = json.details ? ` — ${json.details}` : "";
        setError(msg + details);
        if (json.suggestions?.length) {
          setSuggestions(json.suggestions);
        }
        return;
      }

      setKpi(json.kpi);
      setGeneratedSql(json.sql ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (s: string) => {
    setInput(s);
    setError(null);
    setSuggestions(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-5 pt-6 pb-8 max-w-3xl mx-auto">
        <h1 className="text-base font-bold tracking-tight text-gray-900 mb-1">
          Custom KPI Builder
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter any KPI definition in natural language. The system will analyze your prompt, generate the SQL, fetch data from the database, and display your custom KPI.
        </p>

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Videos published per channel, Average duration by language, Top 5 clients by upload count..."
            className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-red-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : "Create KPI"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
            {(error.includes("GROQ_API_KEY") || error.includes("API key")) && (
              <div className="mt-2 space-y-1 text-xs text-amber-700">
                <p>
                  Add <code className="bg-amber-100 px-1 rounded">GROQ_API_KEY</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file. Get a key at{" "}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">
                    console.groq.com/keys
                  </a>
                </p>
                <p className="font-medium">Important: Restart your dev server (Ctrl+C, then npm run dev) after adding the key.</p>
              </div>
            )}
            {suggestions && suggestions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-red-600 mb-2">Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="text-xs px-3 py-1.5 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* KPI result */}
        {kpi && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    {kpi.label}
                  </p>
                  {kpi.rows && kpi.rows.length > 0 ? (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-4 font-semibold text-gray-600">Channel / Dimension</th>
                            <th className="text-right py-2 font-semibold text-gray-600">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kpi.rows.map((r, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                              <td className="py-2 pr-4 text-gray-900">{r.label}</td>
                              <td className="py-2 text-right font-medium text-gray-900">{r.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{kpi.value ?? "—"}</p>
                  )}
                  {kpi.description && (
                    <p className="mt-2 text-sm text-gray-500">{kpi.description}</p>
                  )}
                </div>
                <div className="shrink-0 h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
              </div>
            </div>

            {/* Generated SQL */}
            {generatedSql && (
              <div className="rounded-xl border border-gray-200 bg-gray-900 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Generated SQL
                </p>
                <pre className="text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                  {generatedSql}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Available KPIs hint */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={fetchAvailableKPIs}
            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            {availableKPIs.length > 0 ? "Hide" : "Show"} available KPIs
          </button>
          {availableKPIs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {availableKPIs.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSuggestionClick(a.label)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-transparent transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
