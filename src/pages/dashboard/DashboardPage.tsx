import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Wallet, Star, RefreshCw } from "lucide-react";
import { products } from "@/data/products";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { formatINR } from "@/lib/format";
import ProductCard from "@/components/ui/ProductCard";
import ProductSkeleton from "@/components/ui/ProductSkeleton";
import type { CategoryId } from "@/components/layout/CategoryBar";

// Map category bar IDs to product data categories
const CATEGORY_MAP: Record<CategoryId, string[]> = {
  All: [],
  Grocery: ["Fruits", "Vegetables", "Dairy", "Bakery", "Meat", "Grains", "Pantry", "Beverages"],
  Electronics: [],
  Fashion: [],
  "Budget Deals": [],
};

interface OutletCtx {
  searchQuery: string;
  activeCategory: CategoryId;
}

function SectionHeader({ icon, title, to }: { icon: React.ReactNode; title: string; to?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">{title}</h2>
      </div>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
        >
          See all <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function ProductGrid({ items, loading }: { items: typeof products; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="text-4xl opacity-30">🔍</span>
        <p className="mt-3 text-sm font-medium text-gray-400">No products found</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <ProductCard product={p} />
        </motion.div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { searchQuery, activeCategory } = useOutletContext<OutletCtx>();
  const budget = useBudgetStore((s) => s.budget);
  const setBudget = useBudgetStore((s) => s.setBudget);
  const clearBudget = useBudgetStore((s) => s.clearBudget);
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const [loading, setLoading] = useState(true);
  const [inputVal, setInputVal] = useState(budget > 0 ? String(budget) : "");
  const [editing, setEditing] = useState(false);

  const hasBudget = budget > 0;
  const spent = totalPrice();

  // Brief shimmer on mount
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const saveBudget = () => {
    const v = parseFloat(inputVal);
    if (!isNaN(v) && v > 0) { setBudget(v); setEditing(false); }
  };

  // Filter by category
  const categoryFiltered = (() => {
    if (activeCategory === "All") return products;
    if (activeCategory === "Budget Deals") return products.filter(p => p.price <= 100 || (p.mrp && p.mrp > p.price && Math.round(((p.mrp - p.price) / p.mrp) * 100) >= 20));
    const cats = CATEGORY_MAP[activeCategory];
    return cats.length ? products.filter(p => cats.includes(p.category)) : [];
  })();

  // Search filter
  const filtered = searchQuery.trim()
    ? categoryFiltered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryFiltered;

  // Product section slices
  const recommended = [...filtered].filter(p => (p.rating ?? 0) >= 4.4).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 10);
  const budgetFriendly = [...filtered].filter(p => p.price <= 100 || (p.mrp && Math.round(((p.mrp - p.price) / p.mrp) * 100) >= 18)).sort((a, b) => a.price - b.price).slice(0, 10);
  const popular = [...filtered].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0)).slice(0, 10);

  const isSearching = !!searchQuery.trim();
  const isCategoryFiltered = activeCategory !== "All";

  // ── No budget set ──
  if (!hasBudget && !editing) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl dark:bg-orange-500/10">
            🎯
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Set Your Budget</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Define a shopping limit and track your spend in real-time.
          </p>
          <div className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
              <input
                type="number" min="0" value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-8 pr-4 text-base font-semibold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <button onClick={saveBudget} className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-700 active:scale-95">
              Set
            </button>
          </div>
          {items.length > 0 && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
              You already have {formatINR(spent)} in your cart.
            </p>
          )}
          <Link to="/shop" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600">
            Browse products <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Edit budget inline ──
  if (editing) {
    return (
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800/40 dark:bg-orange-500/10"
        >
          <p className="mb-3 text-sm font-semibold text-orange-700 dark:text-orange-300">Update Your Budget</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
              <input
                autoFocus type="number" min="0" value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-4 font-semibold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button onClick={saveBudget} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">Save</button>
            <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 pb-28 sm:px-6">
      {/* Budget edit bar */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Budget: <span className="font-bold text-gray-900 dark:text-white">{formatINR(budget)}</span>
          {spent > 0 && <span className="ml-2 text-orange-500">· {formatINR(spent)} spent</span>}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditing(true); setInputVal(String(budget)); }}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <RefreshCw size={12} /> Edit Budget
          </button>
          <button
            onClick={() => { clearBudget(); setInputVal(""); }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-900/20"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Search / category results ── */}
      {(isSearching || isCategoryFiltered) ? (
        <section className="mb-12">
          <SectionHeader
            icon={<span className="text-xl">🔍</span>}
            title={isSearching ? `Results for "${searchQuery}"` : `${activeCategory}`}
          />
          <ProductGrid items={filtered} loading={loading} />
        </section>
      ) : (
        <>
          {/* ── Recommended for You ── */}
          <section className="mb-12">
            <SectionHeader
              icon={<Flame size={20} className="text-orange-500" />}
              title="Recommended for You"
              to="/shop"
            />
            <ProductGrid items={recommended} loading={loading} />
          </section>

          {/* ── Budget Friendly Picks ── */}
          <section className="mb-12">
            <SectionHeader
              icon={<Wallet size={20} className="text-green-500" />}
              title="Budget Friendly Picks"
              to="/shop"
            />
            <ProductGrid items={budgetFriendly} loading={loading} />
          </section>

          {/* ── Popular Products ── */}
          <section className="mb-12">
            <SectionHeader
              icon={<Star size={20} className="text-amber-500" />}
              title="Popular Products"
              to="/shop"
            />
            <ProductGrid items={popular} loading={loading} />
          </section>
        </>
      )}
    </div>
  );
}
