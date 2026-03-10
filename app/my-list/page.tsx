"use client";

import { useEffect, useState, useCallback } from "react";
import type { Dua } from "@/lib/db";
import { triggerLatexDownload } from "@/lib/latex";
import { generatePDF } from "@/lib/pdf";

const STORAGE_KEYS = {
  current: "duamaker_current_list",
  comprehensive: "duamaker_comprehensive_list",
} as const;

function getStoredIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function removeFromStoredList(key: string, id: string) {
  const ids = getStoredIds(key).filter((x) => x !== id);
  localStorage.setItem(key, JSON.stringify(ids));
}

type Tab = "current" | "comprehensive";

export default function MyListPage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("current");
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDuas = useCallback(async () => {
    const key = tab === "current" ? STORAGE_KEYS.current : STORAGE_KEYS.comprehensive;
    const ids = getStoredIds(key);
    if (ids.length === 0) {
      setDuas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/duas/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    setDuas(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchDuas();
  }, [fetchDuas]);

  const handleRemove = (id: string) => {
    const key = tab === "current" ? STORAGE_KEYS.current : STORAGE_KEYS.comprehensive;
    removeFromStoredList(key, id);
    setDuas((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDownloadTex = () => {
    triggerLatexDownload(duas, `dua-list-${tab}.tex`);
  };

  const handleDownloadPdf = async () => {
    await generatePDF(duas, `dua-list-${tab}.pdf`);
  };

  const ids = mounted ? getStoredIds(tab === "current" ? STORAGE_KEYS.current : STORAGE_KEYS.comprehensive) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">My List</h1>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("current")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            tab === "current" ? "bg-cmu-red text-white" : "bg-slate-700/60 text-slate-300 hover:bg-slate-600/60"
          }`}
        >
          Current List
        </button>
        <button
          type="button"
          onClick={() => setTab("comprehensive")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            tab === "comprehensive" ? "bg-cmu-red text-white" : "bg-slate-700/60 text-slate-300 hover:bg-slate-600/60"
          }`}
        >
          Comprehensive List
        </button>
      </div>

      {ids.length === 0 ? (
        <p className="text-slate-400 py-8">
          No duas in your {tab === "current" ? "Current" : "Comprehensive"} list.{" "}
          <a href="/" className="text-cmu-red hover:underline">Browse</a> and add some!
        </p>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={handleDownloadTex}
              disabled={loading || duas.length === 0}
              className="px-4 py-2 rounded-lg bg-cmu-gold/20 text-cmu-gold hover:bg-cmu-gold/30 disabled:opacity-50 transition-colors"
            >
              Download as .tex
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loading || duas.length === 0}
              className="px-4 py-2 rounded-lg bg-cmu-gold/20 text-cmu-gold hover:bg-cmu-gold/30 disabled:opacity-50 transition-colors"
            >
              Download as PDF
            </button>
          </div>

          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : (
            <div className="grid gap-4">
              {duas.map((dua) => (
                <article key={dua.id} className="glass-card p-5">
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
                  <button
                    type="button"
                    onClick={() => handleRemove(dua.id)}
                    className="text-sm text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Remove from list
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
