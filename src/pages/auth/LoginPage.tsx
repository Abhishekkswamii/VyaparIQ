import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { APP_NAME, APP_TAGLINE } from "@/constants/branding";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"/>
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(
    searchParams.get("error") === "google_auth_failed"
      ? "Google sign-in failed. Please try again."
      : null
  );
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setApiError(null);
    try {
      const role = await login(email.trim(), password);
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Real-time budget tracking",
    "Smart spending analytics",
    "Over-budget alerts",
    "Category breakdown insights",
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-12 lg:flex"
      >
        <div className="max-w-md text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <ShoppingCart size={26} className="text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">{APP_NAME}</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-snug">
            Shop smarter.<br />Spend wiser.
          </h2>
          <p className="mt-4 text-lg font-light leading-relaxed text-orange-100">
            Budget-aware shopping that keeps you in control of every rupee — in real time.
          </p>
          <div className="mt-10 space-y-3.5">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="shrink-0 text-orange-200" />
                <span className="text-orange-100">{f}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-3 divide-x divide-white/20 rounded-2xl bg-white/10 text-center">
            {[["500+", "Products"], ["₹0", "Hidden fees"], ["100%", "Privacy"]].map(([val, label]) => (
              <div key={label} className="px-4 py-4">
                <p className="text-2xl font-extrabold">{val}</p>
                <p className="mt-0.5 text-xs text-emerald-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto w-full max-w-lg"
        >
          <div className="mb-8">
            <div className="mb-5 flex items-center gap-2 lg:hidden">
              <ShoppingCart size={26} className="text-orange-500" />
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">{APP_NAME}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome to {APP_NAME}</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                {apiError}
              </div>
            )}
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 dark:bg-gray-900 dark:text-white ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle size={12} />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 dark:bg-gray-900 dark:text-white ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="mt-2 w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-orange-600 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-orange-500 transition-colors hover:text-orange-600 hover:underline"
            >
              Create one free
            </Link>
          </p>

          <div className="relative my-5 flex items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
            <span className="mx-3 text-xs font-medium text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
          </div>

          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-600">
            {APP_NAME} · {APP_TAGLINE}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
