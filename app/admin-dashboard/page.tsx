"use client";

import { useEffect, useState, useCallback } from "react";
import type { Dua } from "@/lib/db";
import Link from "next/link";

type Category = { id: string; name: string; display_order: number };

const AUTH_KEY = "duamaker_admin_password";

function getAuthPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_KEY);
}

function setAuthPassword(password: string) {
  sessionStorage.setItem(AUTH_KEY, password);
}

function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY);
}

function authHeaders(): Record<string, string> {
  const p = getAuthPassword();
  return p ? { Authorization: `Bearer ${p}` } : {};
}

export default function AdminDashboardPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [duas, setDuas] = useState<Dua[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Dua>>({});

  const checkAuth = useCallback(() => {
    setAuthenticated(!!getAuthPassword());
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setAuthPassword(password);
      setAuthenticated(true);
      setPassword("");
    } else {
      setLoginError(data.error || "Invalid password");
    }
  };

  const fetchPending = useCallback(async () => {
    if (!getAuthPassword()) return;
    setLoading(true);
    const res = await fetch("/api/admin/duas", { headers: authHeaders() });
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      setDuas(data);
    }
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!getAuthPassword()) return;
    const res = await fetch("/api/admin/categories", { headers: authHeaders() });
    const data = await res.json();
    if (res.ok && Array.isArray(data)) setCategories(data);
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchPending();
      fetchCategories();
    }
  }, [authenticated, fetchPending, fetchCategories]);

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    if (res.ok) {
      setNewCategoryName("");
      fetchCategories();
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Duas using it will need to be reassigned.")) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) fetchCategories();
  };

  const startEdit = (dua: Dua) => {
    setEditingId(dua.id);
    setEditForm({
      title: dua.title,
      arabic_text: dua.arabic_text,
      translation: dua.translation,
      transliteration: dua.transliteration ?? "",
      commentary: dua.commentary ?? "",
      source: dua.source ?? "",
      category: dua.category,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/admin/duas/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditingId(null);
      setEditForm({});
      fetchPending();
    }
  };

  const approve = async (id: string) => {
    const res = await fetch(`/api/admin/duas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status: "Approved" }),
    });
    if (res.ok) fetchPending();
  };

  const reject = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    const res = await fetch(`/api/admin/duas/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) fetchPending();
  };

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Admin Dashboard</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 focus:border-cmu-red focus:outline-none"
            />
          </div>
          {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-lg bg-cmu-red text-white font-medium hover:bg-cmu-red/90 transition-colors"
          >
            Enter
          </button>
        </form>
        <Link href="/" className="block mt-4 text-slate-400 hover:text-slate-300 text-sm">
          Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { clearAuth(); setAuthenticated(false); }}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-600 text-slate-400 hover:border-slate-500 transition-colors"
          >
            Log out
          </button>
          <Link
            href="/"
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-600 text-slate-400 hover:border-slate-500 transition-colors"
          >
            Browse
          </Link>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Categories</h2>
        <p className="text-slate-400 text-sm mb-3">Define categories for submissions. Submitters can only choose from these.</p>
        <div className="flex gap-2 flex-wrap items-center mb-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
            placeholder="New category name"
            className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600 text-slate-100 text-sm w-48 focus:border-cmu-red focus:outline-none"
          />
          <button
            type="button"
            onClick={addCategory}
            className="px-3 py-2 rounded-lg bg-cmu-red/80 text-white text-sm hover:bg-cmu-red transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-200 text-sm"
            >
              {cat.name}
              <button
                type="button"
                onClick={() => deleteCategory(cat.id)}
                className="text-slate-400 hover:text-red-400 ml-1"
                aria-label={`Delete ${cat.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <h2 className="text-lg font-semibold text-slate-200 mb-4">Pending Duas</h2>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : duas.length === 0 ? (
        <p className="text-slate-400 py-8">No pending submissions.</p>
      ) : (
        <div className="grid gap-6">
          {duas.map((dua) => (
            <article key={dua.id} className="glass-card p-5">
              {editingId === dua.id ? (
                <div className="space-y-3">
                  <input
                    value={editForm.title ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-slate-800/60 border border-slate-600 text-slate-100"
                    placeholder="Title"
                  />
                  <textarea
                    value={editForm.arabic_text ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, arabic_text: e.target.value }))}
                    dir="rtl"
                    rows={2}
                    className="w-full px-3 py-2 rounded bg-slate-800/60 border border-slate-600 text-slate-100 font-arabic"
                    placeholder="Arabic"
                  />
                  <textarea
                    value={editForm.translation ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, translation: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded bg-slate-800/60 border border-slate-600 text-slate-100"
                    placeholder="Translation"
                  />
                  <input
                    value={editForm.transliteration ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, transliteration: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-slate-800/60 border border-slate-600 text-slate-100"
                    placeholder="Transliteration"
                  />
                  <select
                    value={editForm.category ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-slate-800/60 border border-slate-600 text-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {editForm.category && !categories.some((c) => c.name === editForm.category) && (
                      <option value={editForm.category}>{editForm.category}</option>
                    )}
                  </select>
                  <input
                    value={editForm.source ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-slate-800/60 border border-slate-600 text-slate-100"
                    placeholder="Source"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="px-4 py-2 rounded-lg bg-green-600/80 text-white hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 hover:border-slate-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-amber-600/30 text-amber-300 mb-2">
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
                      onClick={() => startEdit(dua)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-600/60 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => approve(dua.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-green-600/80 text-white hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(dua.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
