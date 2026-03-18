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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center gap-3 text-gray-500">
              <div className="h-5 w-5 rounded-full border-2 border-red-200 border-t-red-500 animate-spin" />
              <span className="text-sm">Generating insight...</span>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              {error}
            </div>
          )}
          {!loading && !error && insight && (
            <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
          )}
        </div>
      </div>
    </div>
  );
}
