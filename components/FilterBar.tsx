"use client";

type FilterBarProps = {
  categories: string[];
  selectedCategory: string;
  sort: "newest" | "popularity";
  search: string;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: "newest" | "popularity") => void;
  onSearchChange: (search: string) => void;
};

export function FilterBar({
  categories,
  selectedCategory,
  sort,
  search,
  onCategoryChange,
  onSortChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="w-full sticky top-14 z-10 bg-slate-900/95 backdrop-blur-sm px-6 py-3">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search duas by title, translation, or transliteration…"
          className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cmu-red focus:outline-none text-sm"
        />
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCategoryChange("")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedCategory === ""
                  ? "bg-cmu-red text-white"
                  : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? "bg-cmu-red text-white"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "newest" | "popularity")}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-800/60 text-slate-200 border border-slate-700 focus:border-cmu-red focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>
    </div>
  );
}
