"use client";

import { useState, useRef, useEffect } from "react";

interface DefinitionButtonProps {
  definition: string;
  className?: string;
}

export function DefinitionButton({ definition, className = "" }: DefinitionButtonProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [show]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShow((v) => !v);
        }}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        aria-label="Definition"
        title="Definition"
      >
        ?
      </button>
      {show && (
        <div className="absolute z-50 right-0 top-full mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Definition</div>
          <p className="text-xs text-gray-700 leading-relaxed">{definition}</p>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="mt-2 text-[10px] font-medium text-emerald-600 hover:text-emerald-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
