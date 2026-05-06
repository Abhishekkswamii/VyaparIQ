import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, Mail, MapPin, Plus, Pencil, Trash2, Star, Check, X, ChevronDown, AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  provider: string;
  created_at: string;
}

interface Address {
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

const LABEL_OPTIONS = ["Home", "Work", "Other"];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry",
];

const EMPTY_ADDR: Omit<Address, "id" | "is_default"> = {
  label: "Home", full_name: "", phone: "", address_line1: "", address_line2: "",
  city: "", state: "", pincode: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

// ── Address Form Modal ────────────────────────────────────────────────────────

function AddressModal({
  initial, onSave, onClose,
}: {
  initial?: Address;
  onSave: (data: Omit<Address, "id" | "is_default"> & { is_default: boolean }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    ...(initial ?? EMPTY_ADDR),
    is_default: initial?.is_default ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid 10-digit phone";
    if (!form.address_line1.trim()) e.address_line1 = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state) e.state = "Required";
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const field = (label: string, key: string, placeholder: string, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</label>
      <input
        type={type}
        value={(form as Record<string, unknown>)[key] as string}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition dark:bg-gray-800 dark:text-white
          ${errors[key] ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-gray-200 dark:border-gray-700 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"}`}
      />
      {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {initial ? "Edit Address" : "Add New Address"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {/* Label selector */}
          <div className="mb-5 flex gap-2">
            {LABEL_OPTIONS.map((l) => (
              <button
                key={l} type="button"
                onClick={() => set("label", l)}
                className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition
                  ${form.label === l
                    ? "border-orange-500 bg-orange-50 text-orange-600 dark:border-orange-400 dark:bg-orange-400/10 dark:text-orange-400"
                    : "border-gray-200 text-gray-600 hover:border-orange-300 dark:border-gray-700 dark:text-gray-400"}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {field("Full Name", "full_name", "Enter full name")}
            {field("Phone", "phone", "10-digit mobile number", "tel")}
            {field("Address Line 1", "address_line1", "Flat / House No, Street")}
            {field("Address Line 2 (optional)", "address_line2", "Area, Landmark")}

            <div className="grid grid-cols-2 gap-3">
              {field("City", "city", "City")}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">State</label>
                <div className="relative">
                  <select
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    className={`w-full appearance-none rounded-xl border px-4 py-2.5 text-sm outline-none transition dark:bg-gray-800 dark:text-white
                      ${errors.state ? "border-red-400" : "border-gray-200 dark:border-gray-700 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"}`}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
              </div>
            </div>

            {field("Pincode", "pincode", "6-digit pincode")}

            <label className="flex cursor-pointer items-center gap-3">
              <div
                onClick={() => set("is_default", !form.is_default)}
                className={`flex h-5 w-5 items-center justify-center rounded border-2 transition
                  ${form.is_default ? "border-orange-500 bg-orange-500" : "border-gray-300 dark:border-gray-600"}`}
              >
                {form.is_default && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as default address</span>
            </label>
          </div>
        </form>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button
            type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as never}
            disabled={saving}
            className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Address"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const token = useAuthStore((s) => s.token);
  const authUser = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [showAddrModal, setShowAddrModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | undefined>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  // ── Delete account ──────────────────────────────────────────────────────────

  async function handleDeleteAccount() {
    if (!token || deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        navigate("/login", { replace: true });
      }
    } finally {
      setDeleting(false);
    }
  }

  // ── Fetch data ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/profile", { headers: authHeaders(token) }).then((r) => r.json()),
      fetch("/api/profile/addresses", { headers: authHeaders(token) }).then((r) => r.json()),
    ]).then(([p, a]) => {
      setProfile(p);
      setProfileForm({ first_name: p.first_name ?? "", last_name: p.last_name ?? "", phone: p.phone ?? "" });
      setAddresses(Array.isArray(a) ? a : []);
    }).finally(() => setLoadingProfile(false));
  }, [token]);

  // ── Profile update ────────────────────────────────────────────────────────

  async function saveProfile() {
    if (!token) return;
    setSavingProfile(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(profileForm),
    });
    const data = await res.json();
    if (res.ok) { setProfile(data); setEditingProfile(false); }
    setSavingProfile(false);
  }

  // ── Address CRUD ──────────────────────────────────────────────────────────

  async function saveAddress(form: Omit<Address, "id" | "is_default"> & { is_default: boolean }) {
    if (!token) return;
    if (editingAddr) {
      const res = await fetch(`/api/profile/addresses/${editingAddr.id}`, {
        method: "PUT", headers: authHeaders(token), body: JSON.stringify(form),
      });
      const updated = await res.json();
      if (res.ok) {
        setAddresses((prev) =>
          form.is_default
            ? prev.map((a) => ({ ...a, is_default: a.id === editingAddr.id })).map((a) =>
                a.id === editingAddr.id ? updated : a
              )
            : prev.map((a) => (a.id === editingAddr.id ? updated : a))
        );
      }
    } else {
      const res = await fetch("/api/profile/addresses", {
        method: "POST", headers: authHeaders(token), body: JSON.stringify(form),
      });
      const created = await res.json();
      if (res.ok) {
        setAddresses((prev) =>
          form.is_default
            ? [...prev.map((a) => ({ ...a, is_default: false })), created]
            : [...prev, created]
        );
      }
    }
    setShowAddrModal(false);
    setEditingAddr(undefined);
  }

  async function deleteAddress(id: number) {
    if (!token || !confirm("Delete this address?")) return;
    const res = await fetch(`/api/profile/addresses/${id}`, {
      method: "DELETE", headers: authHeaders(token),
    });
    if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function setDefault(id: number) {
    if (!token) return;
    const res = await fetch(`/api/profile/addresses/${id}/default`, {
      method: "PUT", headers: authHeaders(token),
    });
    if (res.ok) setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-28 pt-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </main>
    );
  }

  const displayName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "User"
    : "User";

  return (
    <main className="mx-auto max-w-3xl px-5 pb-28 pt-8">
      <h1 className="mb-6 text-2xl font-extrabold text-gray-900 dark:text-white">My Profile</h1>

      {/* ── Profile Card ─────────────────────────────────────────────────── */}
      <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-xl font-extrabold text-white shadow-lg">
            {profile ? initials(profile.first_name ?? "", profile.last_name ?? "") : (authUser?.firstName?.[0] ?? "U")}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold
              ${profile?.provider === "google" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}
            >
              {profile?.provider === "google" ? "Google Account" : "Email Account"}
            </span>
          </div>
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:text-gray-400"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>

        <AnimatePresence>
          {editingProfile ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">First Name</label>
                  <input
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Last Name</label>
                  <input
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  <Check size={14} />
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <InfoItem icon={<User size={15} />} label="Full Name" value={displayName} />
              <InfoItem icon={<Mail size={15} />} label="Email" value={profile?.email ?? "—"} />
              <InfoItem icon={<Phone size={15} />} label="Phone" value={profile?.phone ?? "Not added"} />
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Addresses ────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-orange-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Saved Addresses</h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {addresses.length}
            </span>
          </div>
          <button
            onClick={() => { setEditingAddr(undefined); setShowAddrModal(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={14} />
            Add Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl dark:bg-orange-400/10">📍</div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">No saved addresses yet</p>
            <p className="text-sm text-gray-400">Add your home or work address for faster checkout</p>
            <button
              onClick={() => setShowAddrModal(true)}
              className="mt-1 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              + Add First Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <motion.div
                key={addr.id}
                layout
                className={`relative rounded-xl border-2 p-4 transition
                  ${addr.is_default
                    ? "border-orange-400 bg-orange-50/50 dark:border-orange-500 dark:bg-orange-400/5"
                    : "border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold
                        ${addr.label === "Home" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : addr.label === "Work" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}
                      >
                        {addr.label}
                      </span>
                      {addr.is_default && (
                        <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-400/10 dark:text-orange-400">
                          <Star size={10} fill="currentColor" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">{addr.full_name}</p>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {addr.address_line1}
                      {addr.address_line2 && `, ${addr.address_line2}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => { setEditingAddr(addr); setShowAddrModal(true); }}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    {!addr.is_default && (
                      <>
                        <button
                          onClick={() => setDefault(addr.id)}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-white dark:text-orange-400 dark:hover:bg-gray-700"
                        >
                          <Star size={12} /> Default
                        </button>
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-white dark:hover:bg-gray-700"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Danger Zone</h3>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Delete Account</p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => { setShowDeleteDialog(true); setDeleteConfirmText(""); }}
              className="shrink-0 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Delete Account
            </button>
          </div>
        </div>
      </section>

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete your account?</h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This will <strong className="text-red-500">permanently delete</strong> your account and all data including orders, addresses, budget settings, and shopping history.
                </p>
                <div className="mt-4 rounded-xl bg-red-50 p-3 dark:bg-red-950/30">
                  <p className="mb-2 text-xs font-semibold text-red-600 dark:text-red-400">
                    Type <strong>DELETE</strong> to confirm
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE here"
                    className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 dark:border-red-800 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-40"
                >
                  {deleting ? "Deleting…" : "Yes, Delete Everything"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Address Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddrModal && (
          <AddressModal
            initial={editingAddr}
            onSave={saveAddress}
            onClose={() => { setShowAddrModal(false); setEditingAddr(undefined); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
      <span className="text-orange-500">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
      </div>
    </div>
  );
}
