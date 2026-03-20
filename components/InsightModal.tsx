"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  insight: string | null;
  loading: boolean;
  error: string | null;
}

export default function InsightModal({
  isOpen,
  onClose,
  title,
  insight,
  loading,
  error,
}: InsightModalProps) {
  const [visible, setVisible] = useState(false);

  // Trigger enter animation after mount
  useEffect(() => {
    if (isOpen) {
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{
        background: visible ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(6px)" : "blur(0px)",
        transition: "background 0.25s ease, backdrop-filter 0.25s ease",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{
          transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background: "linear-gradient(to right, #fff, rgba(233,67,74,0.04))" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #e9434a 0%, #ff8c42 100%)" }}
            >
              <span className="text-[10px] font-black text-white tracking-tight">AI</span>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Actionable Insight
              </p>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Analyzing your data…</p>
              <p className="text-xs text-gray-400">This takes a few seconds</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && insight && (
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-base font-bold text-gray-900 mt-4 mb-1 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-bold text-gray-800 mt-3 mb-1 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-gray-800 mt-2 mb-1 first:mt-0">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-600">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside pl-4 space-y-1 mb-2 text-sm text-gray-700">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-4 space-y-1 mb-2 text-sm text-gray-700">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-gray-700 leading-relaxed">{children}</li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-red-300 pl-3 text-gray-600 italic my-2">{children}</blockquote>
                  ),
                  hr: () => <hr className="border-gray-200 my-3" />,
                }}
              >
                {insight}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
