"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SubmitPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [arabicText, setArabicText] = useState("");
  const [translation, setTranslation] = useState("");
  const [transliteration, setTransliteration] = useState("");
  const [commentary, setCommentary] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cats) => Array.isArray(cats) && setCategories(cats))
      .catch(() => {});
  }, []);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          arabic_text: arabicText,
          translation,
          transliteration: transliteration || undefined,
          commentary: commentary || undefined,
          source: source || undefined,
          category: category.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Submission failed");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTitle("");
      setArabicText("");
      setTranslation("");
      setTransliteration("");
      setCommentary("");
      setSource("");
      setCategory("");
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Submit a Dua</h1>
      <p className="text-slate-400 mb-6">
        Submit a missing dua for review. It will appear publicly after admin approval.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 placeholder-slate-500 focus:border-cmu-red focus:outline-none"
            placeholder="e.g. Dua for exams"
          />
        </div>

        <div>
          <label htmlFor="arabic" className="block text-sm font-medium text-slate-300 mb-1">
            Arabic text *
          </label>
          <textarea
            id="arabic"
            value={arabicText}
            onChange={(e) => setArabicText(e.target.value)}
            required
            dir="rtl"
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 font-arabic text-lg placeholder-slate-500 focus:border-cmu-red focus:outline-none"
            placeholder="النص العربي"
          />
        </div>

        <div>
          <label htmlFor="translation" className="block text-sm font-medium text-slate-300 mb-1">
            Translation *
          </label>
          <textarea
            id="translation"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            required
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 placeholder-slate-500 focus:border-cmu-red focus:outline-none"
            placeholder="English translation"
          />
        </div>

        <div>
          <label htmlFor="transliteration" className="block text-sm font-medium text-slate-300 mb-1">
            Transliteration (optional)
          </label>
          <input
            id="transliteration"
            type="text"
            value={transliteration}
            onChange={(e) => setTransliteration(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 placeholder-slate-500 focus:border-cmu-red focus:outline-none"
            placeholder="Romanized Arabic"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
            Category *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 focus:border-cmu-red focus:outline-none"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-slate-300 mb-1">
            Source (optional)
          </label>
          <input
            id="source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 placeholder-slate-500 focus:border-cmu-red focus:outline-none"
            placeholder="e.g. Sahih Bukhari"
          />
        </div>

        <div>
          <label htmlFor="commentary" className="block text-sm font-medium text-slate-300 mb-1">
            Commentary / Virtues (optional)
          </label>
          <textarea
            id="commentary"
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 placeholder-slate-500 focus:border-cmu-red focus:outline-none"
            placeholder="Brief notes on virtues or context"
          />
        </div>

        {status === "success" && (
          <p className="text-green-400 text-sm">Thank you! Your submission has been received and will be reviewed.</p>
        )}
        {status === "error" && (
          <p className="text-red-400 text-sm">{errorMsg}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-2 rounded-lg bg-cmu-red text-white font-medium hover:bg-cmu-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? "Submitting..." : "Submit"}
          </button>
          <Link
            href="/"
            className="px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
