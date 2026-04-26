import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, Package } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { formatINR } from "@/lib/format";

function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null || stock === undefined)
    return <span className="text-xs text-gray-600">—</span>;
  if (stock === 0)
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400">Out of Stock</span>;
  if (stock <= 5)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-bold text-yellow-400">
        <AlertTriangle size={10} /> Low: {stock}
      </span>
    );
  return <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-bold text-green-400">{stock} in stock</span>;
}

export default function AdminInventory() {
  const products       = useAdminStore((s) => s.products);
  const totalProducts  = useAdminStore((s) => s.totalProducts);
  const loading        = useAdminStore((s) => s.loading);
  const stats          = useAdminStore((s) => s.stats);
  const fetchProducts  = useAdminStore((s) => s.fetchProducts);
  const fetchStats     = useAdminStore((s) => s.fetchStats);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  useEffect(() => { fetchProducts(1, search); }, [search]);
  useEffect(() => { fetchStats(); }, []);

  const filtered = products.filter((p) => {
    if (filter === "low") return p.stock !== null && p.stock > 0 && p.stock <= 5;
    if (filter === "out") return p.stock === 0;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Inventory</h1>
          <p className="mt-0.5 text-sm text-gray-400">{totalProducts} products</p>
        </div>
        <button
          onClick={() => { fetchProducts(1, search); fetchStats(); }}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Alert cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-yellow-800/40 bg-yellow-500/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">Low Stock</p>
          <p className="mt-1 text-3xl font-extrabold text-white">{stats?.lowStockCount ?? "—"}</p>
          <p className="text-xs text-gray-500 mt-0.5">products ≤ 5 units</p>
        </div>
        <div className="rounded-2xl border border-red-800/40 bg-red-500/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-red-400">Out of Stock</p>
          <p className="mt-1 text-3xl font-extrabold text-white">
            {products.filter((p) => p.stock === 0).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">products at 0 units</p>
        </div>
        <div className="rounded-2xl border border-green-800/40 bg-green-500/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-green-400">Healthy Stock</p>
          <p className="mt-1 text-3xl font-extrabold text-white">
            {products.filter((p) => p.stock !== null && p.stock > 5).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">products {'>'} 5 units</p>
        </div>
      </div>

      {/* Filter + search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
        />
        {(["all", "low", "out"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors
              ${filter === f ? "bg-orange-500 text-white" : "border border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-400"}`}
          >
            {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-900/80">
              {["Product", "Category", "Price", "Stock", "Barcode"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-800">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-800" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-500">
                  <Package size={32} className="mx-auto mb-3 opacity-30" />
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800">
                          <Package size={12} className="text-gray-600" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.category || "—"}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{formatINR(parseFloat(p.price))}</td>
                  <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.barcode || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
