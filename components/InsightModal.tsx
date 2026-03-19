"use client";

import { useEffect } from "react";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center gap-3 text-gray-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
              <span className="text-sm">Generating insight...</span>
            </div>
          )}
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {!loading && !error && insight && (
            <p className="text-sm leading-relaxed text-gray-700">{insight}</p>
          )}
        </div>
      </div>
    </div>
  );
}
