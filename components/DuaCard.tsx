"use client";

import { useState, useEffect, useRef } from "react";
import type { Dua } from "@/lib/db";

type DuaCardProps = {
  dua: Dua;
  inCurrentList: boolean;
  inComprehensiveList: boolean;
  onAddToCurrent: (id: string) => void;
  onAddToComprehensive: (id: string) => void;
};

export function DuaCard({
  dua,
  inCurrentList,
  inComprehensiveList,
  onAddToCurrent,
  onAddToComprehensive,
}: DuaCardProps) {
  const [justAdded, setJustAdded] = useState<"current" | "comprehensive" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleAddCurrent = () => {
    if (inCurrentList) return;
    onAddToCurrent(dua.id);
    setJustAdded("current");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setJustAdded(null);
    }, 1500);
  };

  const handleAddComprehensive = () => {
    if (inComprehensiveList) return;
    onAddToComprehensive(dua.id);
    setJustAdded("comprehensive");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setJustAdded(null);
    }, 1500);
  };

  return (
    <article className="glass-card p-5 transition-all">
      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-cmu-red/20 text-cmu-red mb-2">
        {dua.category}
      </span>
      <h2 className="text-lg font-semibold text-slate-100 mb-2">{dua.title}</h2>
      <p className="text-2xl text-right font-arabic mb-2 leading-loose" dir="rtl">
        {dua.arabic_text}
      </p>
      {dua.transliteration && (
        <p className="text-sm text-slate-400 italic mb-2">{dua.transliteration}</p>
      )}
      <p className="text-slate-300 mb-3">{dua.translation}</p>
      {dua.source && (
        <p className="text-xs text-slate-500 mb-3">Source: {dua.source}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleAddCurrent}
          disabled={inCurrentList}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            inCurrentList
              ? "bg-green-600/20 text-green-400 cursor-default"
              : justAdded === "current"
                ? "bg-green-600/30 text-green-400"
                : "bg-slate-700/60 text-slate-200 hover:bg-cmu-red/20 hover:text-cmu-red"
          }`}
        >
          {inCurrentList ? "In Current List" : justAdded === "current" ? "Added!" : "Add to Current List"}
        </button>
        <button
          type="button"
          onClick={handleAddComprehensive}
          disabled={inComprehensiveList}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            inComprehensiveList
              ? "bg-green-600/20 text-green-400 cursor-default"
              : justAdded === "comprehensive"
                ? "bg-green-600/30 text-green-400"
                : "bg-slate-700/60 text-slate-200 hover:bg-cmu-gold/20 hover:text-cmu-gold"
          }`}
        >
          {inComprehensiveList ? "In Comprehensive List" : justAdded === "comprehensive" ? "Added!" : "Add to Comprehensive List"}
        </button>
      </div>
    </article>
  );
}
