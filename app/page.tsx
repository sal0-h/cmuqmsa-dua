"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DuaCard } from "@/components/DuaCard";
import { FilterBar } from "@/components/FilterBar";
import type { Dua } from "@/lib/db";

const STORAGE_KEYS = {
  current: "duamaker_current_list",
  comprehensive: "duamaker_comprehensive_list",
} as const;

function getStoredIds(key: keyof typeof STORAGE_KEYS): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToStoredList(key: keyof typeof STORAGE_KEYS, id: string): boolean {
  const ids = getStoredIds(key);
  if (ids.includes(id)) return false;
  ids.push(id);
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(ids));
  return true;
}

function fireVote(id: string) {
  fetch(`/api/duas/${id}/vote`, { method: "POST" }).catch(() => {});
}

export default function BrowsePage() {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"newest" | "popularity">("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentIds, setCurrentIds] = useState<Set<string>>(new Set());
  const [comprehensiveIds, setComprehensiveIds] = useState<Set<string>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentIds(new Set(getStoredIds("current")));
    setComprehensiveIds(new Set(getStoredIds("comprehensive")));
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const fetchDuas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("sort", sort);
    if (debouncedSearch) params.set("search", debouncedSearch);
    const res = await fetch(`/api/duas?${params}`);
    const data = await res.json();
    if (Array.isArray(data)) setDuas(data);
    setLoading(false);
  }, [category, sort, debouncedSearch]);

  useEffect(() => {
    fetch(`/api/categories`)
      .then((r) => r.json())
      .then((cats) => Array.isArray(cats) && setCategories(cats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchDuas();
  }, [fetchDuas]);

  const handleAddToCurrent = (id: string) => {
    if (addToStoredList("current", id)) {
      setCurrentIds((prev) => new Set(prev).add(id));
      fireVote(id);
    }
  };

  const handleAddToComprehensive = (id: string) => {
    if (addToStoredList("comprehensive", id)) {
      setComprehensiveIds((prev) => new Set(prev).add(id));
      fireVote(id);
    }
  };

  return (
    <div>
      <FilterBar
        categories={categories}
        selectedCategory={category}
        sort={sort}
        search={search}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        onSearchChange={handleSearchChange}
      />
      <div className="max-w-4xl mx-auto px-6">
      {loading ? (
        <p className="text-slate-400 py-8 text-center">Loading duas...</p>
      ) : duas.length === 0 ? (
        <p className="text-slate-400 py-8 text-center">
          {search ? `No results for "${search}"` : "No duas found. Try a different filter or submit one!"}
        </p>
      ) : (
        <div className="grid gap-4 py-4">
          {duas.map((dua) => (
            <DuaCard
              key={dua.id}
              dua={dua}
              inCurrentList={currentIds.has(dua.id)}
              inComprehensiveList={comprehensiveIds.has(dua.id)}
              onAddToCurrent={handleAddToCurrent}
              onAddToComprehensive={handleAddToComprehensive}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
