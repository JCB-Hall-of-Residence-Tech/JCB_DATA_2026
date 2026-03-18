"use client";

import { useState, useCallback } from "react";
import InsightModal from "./InsightModal";

export interface InsightTriggerProps {
  page: string;
  widget: string;
  filters?: Record<string, string>;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function InsightTrigger({
  page,
  widget,
  filters = {},
  title,
  children,
  className = "",
}: InsightTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      const params = new URLSearchParams({
        page,
        widget,
        filters: JSON.stringify(filters),
      });
      const res = await fetch(`/api/insights?${params}`);

      if (res.ok) {
        const json = await res.json();
        setInsight(json.insight);
        return;
      }

      if (res.status === 404) {
        const computeRes = await fetch("/api/insights/compute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page, widget, filters }),
        });
        if (!computeRes.ok) {
          const err = await computeRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to generate insight");
        }
        const json = await computeRes.json();
        setInsight(json.insight);
        return;
      }

      throw new Error("Failed to fetch insight");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, widget, JSON.stringify(filters)]);

  const handleClick = useCallback(() => {
    setIsOpen(true);
    fetchInsight();
  }, [fetchInsight]);

  const displayTitle = title ?? widget.replace(/_/g, " ");

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        className={`cursor-pointer ${className}`}
      >
        {children}
      </div>
      <InsightModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={displayTitle}
        insight={insight}
        loading={loading}
        error={error}
      />
    </>
  );
}
