import { useEffect, useState } from "react";
import { RefreshCw, Download, FileText, Loader2 } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { useAuthStore } from "@/store/auth-store";

const STATUS_CLS: Record<string, string> = {
  generated: "bg-green-500/15 text-green-400",
  pending:   "bg-yellow-500/15 text-yellow-400",
  failed:    "bg-red-500/15 text-red-400",
};

export default function AdminInvoices() {
  const invoices        = useAdminStore((s) => s.invoices);
  const invoicesLoading = useAdminStore((s) => s.invoicesLoading);
  const fetchAdminInvoices = useAdminStore((s) => s.fetchAdminInvoices);
  const token = useAuthStore((s) => s.token);

  const [dlId, setDlId] = useState<number | null>(null); // tracks invoice.id
  const [search, setSearch] = useState("");

  useEffect(() => { fetchAdminInvoices(); }, [fetchAdminInvoices]);

  const handleDownload = async (invoiceRowId: number, invoiceId: string) => {
    if (!token) return;
    setDlId(invoiceRowId);
    try {
      const r = await fetch(`/api/admin/invoices/${invoiceRowId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${invoiceId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } finally { setDlId(null); }
  };

  const filtered = invoices.filter((inv) =>
    inv.invoice_id.toLowerCase().includes(search.toLowerCase()) ||
    inv.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Invoices</h1>
          <p className="mt-0.5 text-sm text-gray-400">{invoices.length} invoices</p>
        </div>
        <button
          onClick={() => fetchAdminInvoices()}
          disabled={invoicesLoading}
          className="flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          <RefreshCw size={14} className={invoicesLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice ID or email…"
          className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-900/80">
              {["Invoice ID", "Order #", "Customer", "Status", "Size", "Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoicesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-800">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-800" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-500">
                  <FileText size={32} className="mx-auto mb-3 opacity-30" />
                  No invoices found
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-orange-400">{inv.invoice_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">#{inv.order_id}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[160px]">{inv.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLS[inv.invoice_status] ?? STATUS_CLS.pending}`}>
                      {inv.invoice_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {inv.file_size ? `${(inv.file_size / 1024).toFixed(1)} KB` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(inv.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownload(inv.id, inv.invoice_id)}
                      disabled={dlId === inv.id}
                      title={`Download ${inv.invoice_id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-orange-500 hover:text-orange-400 transition-colors disabled:opacity-50"
                    >
                      {dlId === inv.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Download size={12} />}
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
