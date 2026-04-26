import { useState } from "react";
import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useAdminStore } from "@/store/admin-store";
import { APP_NAME } from "@/constants/branding";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
          <ShieldCheck size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-white leading-none">{APP_NAME}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400">
            Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-600">
          Management
        </p>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function AdminLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  const adminEmail = useAuthStore((s) => s.user?.email);
  const authLogout = useAuthStore((s) => s.logout);
  const resetAdmin = useAdminStore((s) => s.reset);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    authLogout();
    resetAdmin();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-gray-800 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-56 border-r border-gray-800 lg:hidden">
            <Sidebar onClose={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800"
            >
              <X size={16} />
            </button>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/80 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-300">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-500 sm:block">
              {adminEmail}
            </span>
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-red-800 hover:bg-red-900/20 hover:text-red-400"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
