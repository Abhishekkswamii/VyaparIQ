import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Tag,
  Lock,
  ShoppingBag,
  PackageCheck,
  Plus,
  Pencil,
  Trash2,
  Check,
  Banknote,
  CreditCard,
  Smartphone,
  MapPin,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { useAuthStore } from "@/store/auth-store";
import { useOffersStore, calculateDiscount } from "@/store/offers-store";
import { useToastStore } from "@/store/toast-store";
import { formatINR } from "@/lib/format";
import FormField from "@/components/checkout/FormField";
import PredictiveBanner from "@/components/cart/PredictiveBanner";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedAddress {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface ManualAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

type FormErrors = Partial<Record<keyof ManualAddress, string>>;type PaymentMethod = "cod";

// ── Validation ────────────────────────────────────────────────────────────────

function validateManual(addr: ManualAddress): FormErrors {
  const errors: FormErrors = {};
  if (!addr.name.trim()) errors.name = "Full name is required";
  if (!/^\d{10}$/.test(addr.phone.replace(/\s/g, ""))) errors.phone = "Enter a valid 10-digit mobile number";
  if (addr.address.trim().length < 10) errors.address = "Enter a complete street address (min 10 chars)";
  if (!addr.city.trim()) errors.city = "City is required";
  if (!/^\d{6}$/.test(addr.pincode)) errors.pincode = "Enter a valid 6-digit pincode";
  return errors;
}

// ── Checkout Item Row (read-only) ─────────────────────────────────────────────

interface CheckoutItemRowProps {
  image: string;
  name: string;
  quantity: number;
  lineTotal: number;
}

function CheckoutItemRow({ image, name, quantity, lineTotal }: CheckoutItemRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
        <img src={image} alt={name} className="h-full w-full object-cover" />
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
          {quantity}
        </span>
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
        {name}
      </p>
      <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
        {formatINR(lineTotal)}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const price = useCartStore((s) => s.totalAmount);
  const itemCount = useCartStore((s) => s.itemCount);
  const clearCart = useCartStore((s) => s.clearCart);
  const budget = useBudgetStore((s) => s.budget);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const getAppliedOffer = useOffersStore((s) => s.getAppliedOffer);
  const addToast = useToastStore((s) => s.addToast);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | "new" | null>(null);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [editingAddr, setEditingAddr] = useState<SavedAddress | null>(null);

  // Manual address form (shown when selectedAddrId === "new")
  const [manualAddr, setManualAddr] = useState<ManualAddress>({
    name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    phone: "", address: "", city: "", pincode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const [payment] = useState<PaymentMethod>("cod");
  const [placing, setPlacing] = useState(false);
  const orderPlaced = useRef(false);

  // ── Fetch saved addresses ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoadingAddr(false); setSelectedAddrId("new"); return; }
    fetch("/api/profile/addresses", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: SavedAddress[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedAddresses(data);
          const def = data.find((a) => a.is_default) ?? data[0];
          setSelectedAddrId(def.id);
        } else {
          setSelectedAddrId("new");
        }
      })
      .catch(() => setSelectedAddrId("new"))
      .finally(() => setLoadingAddr(false));
  }, [token]);

  if (items.length === 0 && !orderPlaced.current) return <Navigate to="/cart" replace />;

  // ── Derived values ──────────────────────────────────────────────────────────
  const appliedOffer = getAppliedOffer();
  const { total: discountTotal, breakdown } = calculateDiscount(items, appliedOffer);
  const finalPrice = Math.max(0, price - discountTotal);

  const hasBudget = budget > 0;
  const isOverBudget = hasBudget && price > budget;
  const remaining = hasBudget ? budget - price : 0;
  const pct = hasBudget ? Math.min((price / budget) * 100, 100) : 0;
  const isNearLimit = !isOverBudget && pct > 80;

  // ── Address helpers ──────────────────────────────────────────────────────────
  const setField = (field: keyof ManualAddress) => (value: string) => {
    setManualAddr((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function deleteAddress(id: number) {
    if (!token || !confirm("Delete this address?")) return;
    await fetch(`/api/profile/addresses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
    if (selectedAddrId === id) setSelectedAddrId(savedAddresses.length > 1 ? savedAddresses.find((a) => a.id !== id)!.id : "new");
  }

  async function saveEditedAddress() {
    if (!editingAddr || !token) return;
    const res = await fetch(`/api/profile/addresses/${editingAddr.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editingAddr),
    });
    if (res.ok) {
      const updated: SavedAddress = await res.json();
      setSavedAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditingAddr(null);
    }
  }

  // ── Place order ──────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    let orderAddress: Record<string, string>;

    if (selectedAddrId === "new" || selectedAddrId === null) {
      const errs = validateManual(manualAddr);
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
      orderAddress = {
        name: manualAddr.name, phone: manualAddr.phone,
        address: manualAddr.address, city: manualAddr.city, pincode: manualAddr.pincode,
      };
    } else {
      const sa = savedAddresses.find((a) => a.id === selectedAddrId);
      if (!sa) { addToast({ message: "Please select a delivery address.", type: "danger" }); return; }
      orderAddress = {
        name: sa.full_name, phone: sa.phone,
        address: [sa.address_line1, sa.address_line2].filter(Boolean).join(", "),
        city: sa.city, state: sa.state, pincode: sa.pincode,
      };
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.quantity, category: i.category })),
          subtotal: price, discount: discountTotal, total: finalPrice,
          address: orderAddress, payment_method: payment,
        }),
      });
      if (!res.ok) throw new Error(`Order failed`);
      const data = await res.json();
      const orderId = data.order?.id;
      orderPlaced.current = true;
      clearCart();
      navigate(`/orders/${orderId}/confirmation`, {
        replace: true,
        state: {
          orderId,
          total:         finalPrice,
          itemCount,
          items:         items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
          address:       orderAddress,
          paymentMethod: payment,
          invoiceId:     data.invoice?.invoice_id ?? null,
          hasInvoice:    !!data.invoice,
        },
      });
    } catch {
      addToast({ message: "Could not place order. Please try again.", type: "danger" });
    } finally {
      setPlacing(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">
      {/* Over-budget full-width banner */}
      {isOverBudget && (
        <div className="-mx-5 mb-5 flex items-center justify-center gap-2 bg-red-600 px-4 py-3 text-sm font-bold text-white">
          🚨 Cart exceeds budget by {formatINR(price - budget)}
        </div>
      )}

      {/* Back nav */}
      <div className="mb-6">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
        >
          <ArrowLeft size={15} />
          Back to cart
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* ── LEFT: Address + Payment ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-5 lg:col-span-3"
        >
          {/* ── STEP 1: Delivery Address ─────────────────────────────── */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
                <MapPin size={16} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Delivery Address</h2>
            </div>

            {loadingAddr ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Saved address cards */}
                {savedAddresses.map((addr) => (
                  <div key={addr.id}>
                    {editingAddr?.id === addr.id ? (
                      /* Inline edit form */
                      <div className="rounded-xl border-2 border-orange-400 bg-orange-50/30 p-4 dark:bg-orange-400/5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-orange-600">Editing Address</p>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-gray-500">Full Name</label>
                              <input value={editingAddr.full_name} onChange={(e) => setEditingAddr({ ...editingAddr, full_name: e.target.value })}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-gray-500">Phone</label>
                              <input value={editingAddr.phone} onChange={(e) => setEditingAddr({ ...editingAddr, phone: e.target.value })}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-500">Address Line 1</label>
                            <input value={editingAddr.address_line1} onChange={(e) => setEditingAddr({ ...editingAddr, address_line1: e.target.value })}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-gray-500">City</label>
                              <input value={editingAddr.city} onChange={(e) => setEditingAddr({ ...editingAddr, city: e.target.value })}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-gray-500">Pincode</label>
                              <input value={editingAddr.pincode} onChange={(e) => setEditingAddr({ ...editingAddr, pincode: e.target.value })}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={saveEditedAddress} className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600">
                            <Check size={12} /> Save
                          </button>
                          <button onClick={() => setEditingAddr(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Selectable address card */
                      <button
                        type="button"
                        onClick={() => setSelectedAddrId(addr.id)}
                        className={`w-full rounded-xl border-2 p-4 text-left transition
                          ${selectedAddrId === addr.id
                            ? "border-orange-500 bg-orange-50/50 dark:border-orange-400 dark:bg-orange-400/5"
                            : "border-gray-100 bg-gray-50/50 hover:border-orange-200 dark:border-gray-800 dark:bg-gray-800/30"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition
                            ${selectedAddrId === addr.id ? "border-orange-500 bg-orange-500" : "border-gray-300 dark:border-gray-600"}`}>
                            {selectedAddrId === addr.id && <Check size={10} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold
                                ${addr.label === "Home" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : addr.label === "Work" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}>
                                {addr.label}
                              </span>
                              {addr.is_default && <span className="text-xs font-semibold text-orange-500">Default</span>}
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">{addr.full_name}</p>
                            <p className="text-sm text-gray-500">{addr.phone}</p>
                            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                              {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}, {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setEditingAddr(addr)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-orange-500 dark:hover:bg-gray-700">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deleteAddress(addr.id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-red-500 dark:hover:bg-gray-700">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                ))}

                {/* Add new address option */}
                <button
                  type="button"
                  onClick={() => setSelectedAddrId("new")}
                  className={`w-full rounded-xl border-2 p-4 text-left transition
                    ${selectedAddrId === "new"
                      ? "border-orange-500 bg-orange-50/50 dark:border-orange-400 dark:bg-orange-400/5"
                      : "border-dashed border-gray-200 hover:border-orange-300 dark:border-gray-700"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition
                      ${selectedAddrId === "new" ? "border-orange-500 bg-orange-500" : "border-gray-300 dark:border-gray-600"}`}>
                      {selectedAddrId === "new" ? <Check size={10} className="text-white" /> : <Plus size={10} className="text-gray-400" />}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Use a different address</span>
                  </div>
                </button>

                {/* New address form */}
                <AnimatePresence>
                  {selectedAddrId === "new" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800" data-checkout-form>
                        <FormField id="name" label="Full Name" value={manualAddr.name} onChange={setField("name")} placeholder="Ravi Kumar" error={errors.name} />
                        <FormField id="phone" label="Mobile Number" value={manualAddr.phone} onChange={setField("phone")} placeholder="98XXXXXXXX" error={errors.phone} type="tel" maxLength={10} inputMode="numeric" />
                        <FormField id="address" label="Street Address" value={manualAddr.address} onChange={setField("address")} placeholder="House no., Street, Area, Landmark" error={errors.address} multiline />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField id="city" label="City" value={manualAddr.city} onChange={setField("city")} placeholder="Mumbai" error={errors.city} />
                          <FormField id="pincode" label="Pincode" value={manualAddr.pincode} onChange={setField("pincode")} placeholder="400001" error={errors.pincode} maxLength={6} inputMode="numeric" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <p className="mt-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
              <Lock size={11} />
              Your details are encrypted and never shared
            </p>
          </div>

          {/* ── STEP 2: Payment Method ────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
                <PackageCheck size={16} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Payment Method</h2>
            </div>

            <div className="space-y-3">
              {/* COD — active */}
              <div className="flex items-center gap-4 rounded-xl border-2 border-orange-500 bg-orange-50/50 p-4 dark:border-orange-400 dark:bg-orange-400/5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-500">
                  <Check size={10} className="text-white" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                    <Banknote size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when your order arrives</p>
                  </div>
                </div>
              </div>

              {/* UPI — coming soon */}
              <div className="flex cursor-not-allowed items-center gap-4 rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4 opacity-50 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <Smartphone size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">UPI / PhonePe / GPay</p>
                    <p className="text-xs text-orange-500 font-semibold">Coming soon</p>
                  </div>
                </div>
              </div>

              {/* Card — coming soon */}
              <div className="flex cursor-not-allowed items-center gap-4 rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4 opacity-50 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <CreditCard size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Credit / Debit Card</p>
                    <p className="text-xs text-orange-500 font-semibold">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: Order summary ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="lg:col-span-2"
        >
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-5 text-base font-bold text-gray-900 dark:text-white">
              Order Summary
            </h3>

            {/* Items list */}
            <div className="mb-5 max-h-48 space-y-3 overflow-y-auto pr-0.5">
              {items.map((item) => (
                <CheckoutItemRow
                  key={item.id}
                  image={item.image}
                  name={item.name}
                  quantity={item.quantity}
                  lineTotal={item.price * item.quantity}
                />
              ))}
            </div>

            <div className="mb-5 h-px bg-gray-100 dark:bg-gray-800" />

            {/* Budget indicator */}
            {hasBudget ? (
              <div className="mb-5 rounded-xl bg-orange-50 p-4 dark:bg-orange-500/10">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Budget
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isOverBudget
                        ? "text-red-500"
                        : pct > 80
                        ? "text-amber-500"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {Math.round(pct)}% used
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-orange-200 dark:bg-gray-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isOverBudget
                        ? "bg-red-500"
                        : pct > 80
                        ? "bg-amber-400"
                        : "bg-orange-500"
                    }`}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{formatINR(price)} spent</span>
                  <span>{formatINR(budget)} budget</span>
                </div>
                {!isOverBudget && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                    <CheckCircle2 size={11} />
                    {formatINR(remaining)} remaining
                  </p>
                )}
              </div>
            ) : (
              <Link
                to="/dashboard"
                className="mb-5 flex items-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 p-3.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-700/40 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/15"
              >
                <Wallet size={16} />
                Set a budget to track spending →
              </Link>
            )}

            {/* AI predictive warning */}
            <div className="mb-4">
              <PredictiveBanner />
            </div>

            {/* Budget alerts */}
            <AnimatePresence>
              {isOverBudget && (
                <motion.div
                  key="over"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20"
                >
                  <AlertTriangle size={15} className="shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                    Over budget by {formatINR(price - budget)}. Consider removing items.
                  </p>
                </motion.div>
              )}
              {isNearLimit && (
                <motion.div
                  key="near"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20"
                >
                  <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {Math.round(pct)}% of budget used — approaching limit!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Price breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatINR(price)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Delivery</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">Free</span>
              </div>

              {breakdown.length > 0 &&
                breakdown.map((b) => (
                  <div key={b.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Tag size={12} />
                      {b.label}
                    </span>
                    <span className="font-semibold text-green-600">
                      −{formatINR(b.amount)}
                    </span>
                  </div>
                ))}

              {breakdown.length === 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Tag size={12} />
                    Discount
                  </span>
                  <span className="font-semibold text-gray-400 dark:text-gray-600">—</span>
                </div>
              )}

              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <AnimatedNumber
                  value={finalPrice}
                  className={`text-xl font-extrabold ${
                    isOverBudget ? "text-red-600" : "text-gray-900 dark:text-white"
                  }`}
                />
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="mt-5 w-full rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {placing ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Placing Order…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingBag size={16} />
                  Place Order · {formatINR(finalPrice)}
                </span>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 dark:text-gray-600">
              <Lock size={11} />
              Secure &amp; encrypted checkout
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
