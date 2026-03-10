"use client";

const QUICK_CATEGORY_COUNT = 6;

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
  const quickCats = categories.slice(0, QUICK_CATEGORY_COUNT);

  return (
    <div className="w-full sticky top-14 z-10 bg-slate-900/95 backdrop-blur-sm px-4 sm:px-6 py-3">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search duas by title, translation, or transliteration…"
          className="w-full px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cmu-red focus:outline-none text-sm"
        />
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCategoryChange("")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors shrink-0 ${
                  selectedCategory === ""
                    ? "bg-cmu-red text-white"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
                }`}
              >
                All
              </button>
              {quickCats.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onCategoryChange(cat)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors shrink-0 ${
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
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 text-sm rounded-lg bg-slate-800/60 text-slate-200 border border-slate-700 focus:border-cmu-red focus:outline-none"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as "newest" | "popularity")}
            className="px-3 py-2 text-sm rounded-lg bg-slate-800/60 text-slate-200 border border-slate-700 focus:border-cmu-red focus:outline-none shrink-0 w-full sm:w-auto"
          >
            <option value="newest">Newest First</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>
    </div>
  );
}
