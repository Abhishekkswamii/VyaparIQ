import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { products } from "@/data/products";
import ProductCard from "@/components/ui/ProductCard";
import { usePrefsStore } from "@/store/prefs-store";

const ALL_CATEGORIES = [
  "All",
  ...Array.from(new Set(products.map((p) => p.category))).sort(),
];

const PRICE_RANGES = [
  { label: "Under ₹100", min: 0, max: 100 },
  { label: "₹100 – ₹200", min: 100, max: 200 },
  { label: "₹200 – ₹400", min: 200, max: 400 },
  { label: "₹400+", min: 400, max: Infinity },
];

const SORT_OPTIONS = [
  { label: "Relevance", value: "default" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
  { label: "Biggest Discount", value: "discount" },
];

export default function ShopPage() {
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [query, setQuery] = useState("");
  const [priceKey, setPriceKey] = useState<string | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const selectedRange = PRICE_RANGES.find((r) => r.label === priceKey) ?? null;

  const filtered = useMemo(() => {
    let result = [...products];

    if (category !== "All") result = result.filter((p) => p.category === category);

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (selectedRange) {
      result = result.filter(
        (p) => p.price >= selectedRange.min && p.price <= selectedRange.max
      );
    }

    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sortBy === "discount")
      result.sort(
        (a, b) =>
          ((b.mrp ?? b.price) - b.price) / (b.mrp ?? b.price) -
          ((a.mrp ?? a.price) - a.price) / (a.mrp ?? a.price)
      );

    return result;
  }, [category, sortBy, query, selectedRange]);

  const resetFilters = () => {
    setCategory("All");
    setSortBy("default");
    setQuery("");
    setPriceKey(null);
  };

  const hasFilters = category !== "All" || sortBy !== "default" || query || priceKey;

  const favCats = usePrefsStore((s) => s.favoriteCategories);
  const recentIds = usePrefsStore((s) => s.recentlyViewed);

  const recommended = useMemo(() => {
    const scored = products.map((p) => {
      let score = 0;
      if (favCats.includes(p.category)) score += 3;
      const recIdx = recentIds.indexOf(p.id);
      if (recIdx !== -1) score += 2 - recIdx * 0.1;
      if ((p.rating ?? 0) >= 4.5) score += 1;
      if (p.badge) score += 0.5;
      return { product: p, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((s) => s.product);
  }, [favCats, recentIds]);

  const FilterSidebar = () => (
    <div className="space-y-5">
      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Category
        </p>
        <div className="space-y-1">
          {ALL_CATEGORIES.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2.5 py-0.5">
              <input
                type="radio"
                name="cat"
                checked={category === cat}
                onChange={() => { setCategory(cat); setShowMobileFilter(false); }}
                className="h-3.5 w-3.5 accent-orange-500"
              />
              <span
                className={`text-sm transition-colors ${
                  category === cat
                    ? "font-semibold text-orange-500"
                    : "text-gray-700 hover:text-orange-500 dark:text-gray-300 dark:hover:text-orange-400"
                }`}
              >
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-800" />

      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Price
        </p>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => (
            <label key={range.label} className="flex cursor-pointer items-center gap-2.5 py-0.5">
              <input
                type="radio"
                name="price"
                checked={priceKey === range.label}
                onChange={() => setPriceKey(range.label)}
                className="h-3.5 w-3.5 accent-orange-500"
              />
              <span
                className={`text-sm transition-colors ${
                  priceKey === range.label
                    ? "font-semibold text-orange-500"
                    : "text-gray-700 hover:text-orange-500 dark:text-gray-300 dark:hover:text-orange-400"
                }`}
              >
                {range.label}
              </span>
            </label>
          ))}
          {priceKey && (
            <button
              onClick={() => setPriceKey(null)}
              className="mt-1 text-xs font-medium text-blue-600 hover:underline"
            >
              Clear price filter
            </button>
          )}
        </div>
      </div>

      {hasFilters && (
        <>
          <div className="h-px bg-gray-200 dark:bg-gray-800" />
          <button
            onClick={resetFilters}
            className="w-full rounded border border-orange-500 py-2 text-sm font-semibold text-orange-500 hover:bg-orange-50 dark:border-orange-500/50 dark:text-orange-400 dark:hover:bg-orange-500/10"
          >
            Clear All Filters
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Search bar */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groceries, dairy, fruits…"
              className="h-12 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 pl-11 pr-10 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-orange-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button className="h-12 hidden sm:block rounded-2xl bg-orange-600 px-8 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 active:scale-95 transition-all">
            Search
          </button>
          <button
            onClick={() => setShowMobileFilter(true)}
            className="flex h-12 items-center gap-2 rounded-2xl border-2 border-gray-100 px-4 text-sm font-bold text-gray-700 hover:border-orange-400 hover:text-orange-500 lg:hidden dark:border-gray-700 dark:text-gray-300 dark:hover:border-orange-500 dark:hover:text-orange-400"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="border-b border-gray-200 bg-white/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex gap-2.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-xl px-5 py-1.5 text-xs font-bold transition-all ${
                  category === cat
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "border-2 border-gray-100 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-6 pb-32 sm:px-6 lg:px-8">
        <div className="flex gap-4">
          {/* Desktop sidebar */}
          <aside className="hidden w-52 shrink-0 lg:block">
            <div className="rounded border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Filters</h3>
                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-semibold text-orange-500 hover:underline dark:text-orange-400"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main product area */}
          <div className="flex-1 min-w-0">
            {/* Sort + results bar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-bold text-gray-900 dark:text-white">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "result" : "results"}
                {category !== "All" && (
                  <span className="ml-1 text-gray-400 dark:text-gray-500">in {category}</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded border border-gray-200 bg-white py-1 pl-2 pr-7 text-sm font-medium text-gray-700 outline-none focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recommended for you */}
            {recommended.length > 0 && !query && category === "All" && (
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-2">
                  <Heart size={15} className="text-pink-500" />
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Recommended For You</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {recommended.map((product) => (
                    <motion.div
                      key={`rec-${product.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
                <div className="my-4 h-px bg-gray-200 dark:bg-gray-800" />
              </div>
            )}

            {/* Product grid */}
            {filtered.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((product, i) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded border border-dashed border-gray-300 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-900">
                <Search size={36} className="mb-3 text-gray-300" />
                <p className="font-semibold text-gray-600 dark:text-gray-400">No products found</p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                  Try a different search term or category
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 rounded bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Show all products
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {showMobileFilter && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilter(false)}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 w-72 overflow-y-auto bg-white p-5 shadow-2xl lg:hidden dark:bg-gray-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Filters</h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
              <FilterSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
