"use client";

import { useState } from "react";
import InsightModal from "@/components/InsightModal";

interface InsightButtonProps {
  page: string;
  widget: string;
  title?: string;
  filters?: Record<string, string>;
  className?: string;
}

function theme(page: string): string {
  if (page === "page1") return "text-red-600 hover:bg-red-50";
  if (page === "page2") return "text-rose-600 hover:bg-rose-50";
  if (page === "page3") return "text-orange-600 hover:bg-orange-50";
  if (page === "page4") return "text-emerald-600 hover:bg-emerald-50";
  if (page === "page5") return "text-indigo-600 hover:bg-indigo-50";
  return "text-blue-600 hover:bg-blue-50";
}

export function InsightButton({
  page,
  widget,
  title,
  filters = {},
  className = "",
}: InsightButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const filtersKey = Object.keys(filters).length
    ? JSON.stringify(filters, Object.keys(filters).sort())
    : "";

  async function loadInsight(forceRegenerate = false) {
    setLoading(true);
    setError(null);

    // 1. Check cache unless regenerating
    if (!forceRegenerate) {
      try {
        const params = new URLSearchParams({ page, widget, filters: filtersKey });
        const res = await fetch(`/api/insights?${params}`);
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json.cached && json.insight) {
            setInsight(json.insight);
            setCached(true);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Cache miss — fall through to compute
      }
    }

    // 2. Compute fresh insight
    setCached(false);
    try {
      const res = await fetch("/api/insights/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, widget, filters }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate insight");
      }
      setInsight(json.insight ?? "No insight available.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    setIsOpen(true);
    loadInsight(false);
  }

  function handleRegenerate() {
    setInsight(null);
    loadInsight(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex h-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tracking-wide transition-colors ${theme(page)} ${className}`}
        aria-label="Actionable insight"
        title="Actionable insight"
      >
        AI
      </button>
      <InsightModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title ?? widget.replace(/_/g, " ")}
        insight={insight}
        loading={loading}
        error={error}
        cached={cached}
        onRegenerate={handleRegenerate}
      />
    </>
  );
}
