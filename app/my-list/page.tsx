"use client";

import { useEffect, useState, useCallback } from "react";
import type { Dua } from "@/lib/db";
import { triggerLatexDownload } from "@/lib/latex";
import Link from "next/link";
import {
  STORAGE_KEYS,
  getStoredIds,
  removeFromStoredList,
} from "@/lib/storage";

type Tab = "current" | "comprehensive";

export default function MyListPage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("current");
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDuas = useCallback(async () => {
    const key = tab === "current" ? "current" : "comprehensive";
    const ids = getStoredIds(key);
    if (ids.length === 0) {
      setDuas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/duas/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      setDuas(Array.isArray(data) ? data : []);
    } catch {
      setDuas([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchDuas();
  }, [fetchDuas]);

  const handleRemove = (id: string) => {
    const key = tab === "current" ? "current" : "comprehensive";
    removeFromStoredList(key, id);
    setDuas((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDownloadTex = () => {
    triggerLatexDownload(duas, `dua-list-${tab}.tex`);
  };

  const handleDownloadPdf = async () => {
    const ids = duas.map((d) => d.id);
    if (ids.length === 0) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dua-list-${tab}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const ids = mounted ? getStoredIds(tab === "current" ? "current" : "comprehensive") : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
          <Link href="/" className="text-cmu-red hover:underline">
            Browse
          </Link>{" "}
          and add some!
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
              disabled={loading || duas.length === 0 || pdfLoading}
              className="px-4 py-2 rounded-lg bg-cmu-gold/20 text-cmu-gold hover:bg-cmu-gold/30 disabled:opacity-50 transition-colors"
            >
              {pdfLoading ? "Generating…" : "Download as PDF"}
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
