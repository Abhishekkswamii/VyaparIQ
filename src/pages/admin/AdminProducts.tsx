import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { useAdminStore, type AdminProduct } from "@/store/admin-store";
import ProductModal from "@/components/admin/ProductModal";

// ── Delete confirmation inline dialog ─────────────────────────────────────────

function DeleteConfirm({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: AdminProduct;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 rounded-xl border border-red-800/60 bg-gray-900 px-4 py-3 shadow-xl"
    >
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle size={15} className="shrink-0 text-red-400" />
        <span className="text-gray-300">
          Delete{" "}
          <span className="font-semibold text-white">{product.name}</span>?
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          Delete
        </button>
      </div>
    </motion.div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: AdminProduct;
  onEdit: (p: AdminProduct) => void;
  onDelete: (p: AdminProduct) => void;
}) {
  const price = parseFloat(product.price);
  const lowStock = product.stock < 10;

  return (
    <tr className="border-b border-gray-800 transition-colors hover:bg-gray-800/40">
      {/* Image */}
      <td className="px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gray-800">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ImageIcon size={18} className="text-gray-600" />
          )}
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <p className="max-w-[200px] truncate text-sm font-semibold text-white">
          {product.name}
        </p>
        {product.barcode && (
          <p className="font-mono text-xs text-gray-500">{product.barcode}</p>
        )}
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-400">
          {product.category}
        </span>
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <p className="text-sm font-bold text-white">
          ₹{price.toLocaleString("en-IN")}
        </p>
      </td>

      {/* Stock */}
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            lowStock
              ? "bg-red-900/40 text-red-400"
              : "bg-green-900/30 text-green-400"
          }`}
        >
          {product.stock}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(product)}
            aria-label={`Edit ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-400 transition hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(product)}
            aria-label={`Delete ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-400 transition hover:border-red-700 hover:bg-red-900/20 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminProducts() {
  const fetchProducts = useAdminStore((s) => s.fetchProducts);
  const createProduct = useAdminStore((s) => s.createProduct);
  const updateProduct = useAdminStore((s) => s.updateProduct);
  const deleteProduct = useAdminStore((s) => s.deleteProduct);
  const products = useAdminStore((s) => s.products);
  const loading = useAdminStore((s) => s.loading);
  const totalProducts = useAdminStore((s) => s.totalProducts);
  const currentPage = useAdminStore((s) => s.currentPage);
  const totalPages = useAdminStore((s) => s.totalPages);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchProducts(1, debouncedSearch);
  }, [debouncedSearch, fetchProducts]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchProducts(page, debouncedSearch);
    },
    [fetchProducts, debouncedSearch]
  );

  const handleOpenAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleEdit = (product: AdminProduct) => {
    setEditTarget(product);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteProduct(deleteTarget.id);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleSave = async (formData: FormData) => {
    if (editTarget) {
      await updateProduct(editTarget.id, formData);
    } else {
      await createProduct(formData);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Products</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {totalProducts} total product{totalProducts !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98]"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or category…"
          className="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pl-11 pr-10 text-sm text-white placeholder-gray-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading products…</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={40} className="mb-3 text-gray-700" />
            <p className="text-sm font-semibold text-gray-400">
              {debouncedSearch ? "No products match your search" : "No products yet"}
            </p>
            {!debouncedSearch && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 text-sm font-semibold text-orange-400 hover:underline"
              >
                Add your first product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  {["", "Name", "Category", "Price", "Stock", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="relative">
                <AnimatePresence>
                  {deleteTarget && (
                    <tr>
                      <td colSpan={6} className="relative p-0">
                        <DeleteConfirm
                          product={deleteTarget}
                          onConfirm={handleDeleteConfirm}
                          onCancel={() => setDeleteTarget(null)}
                          loading={deleteLoading}
                        />
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
                {products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
            <p className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-400 transition hover:bg-gray-800 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-400 transition hover:bg-gray-800 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProductModal
          product={editTarget}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
