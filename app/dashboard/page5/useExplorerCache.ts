"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Row = Record<string, unknown>;
type TableData = { rowCount: number; rows: Row[] };
type Alert = {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  table: string;
};
interface Page5Response {
  tables: Record<string, TableData>;
  alerts: Alert[];
}

// ── Module-level singleton ────────────────────────────────────────────────────
// Lives in the JS heap for the lifetime of the browser tab.
// Automatically released (garbage-collected) when the tab is closed.
// sessionStorage was intentionally NOT used — the full dataset can be many MB
// and sessionStorage serialises everything to JSON strings (5 MB limit, slow).
const explorerCache = new Map<string, Page5Response>();
const CACHE_KEY = "page5:bulk";

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useExplorerCache() {
  // Synchronous initialiser: if already cached, populate state on first paint
  // so the component renders with data immediately — no loading spinner shown.
  const [data, setData] = useState<Page5Response | null>(
    () => explorerCache.get(CACHE_KEY) ?? null
  );
  const [loading, setLoading] = useState(() => !explorerCache.has(CACHE_KEY));
  const [error, setError] = useState<string | null>(null);

  const fetchAndCache = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/page5");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: Page5Response = await res.json();
      explorerCache.set(CACHE_KEY, json);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Cache hit → skip fetch entirely
    if (explorerCache.has(CACHE_KEY)) return;
    fetchAndCache();
  }, [fetchAndCache]);

  // Call this after mutations (upload, add-column) to bust the cache and re-fetch
  const invalidateAndRefetch = useCallback(async () => {
    explorerCache.delete(CACHE_KEY);
    await fetchAndCache();
  }, [fetchAndCache]);

  return { data, loading, error, invalidateAndRefetch };
}
