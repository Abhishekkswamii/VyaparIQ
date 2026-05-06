import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import VyaparIQLogo from "@/components/ui/VyaparIQLogo";
import { APP_NAME } from "@/constants/branding";

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get("token") ?? "";

  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-800 dark:bg-gray-900">
          <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-xl font-extrabold text-gray-900 dark:text-white">Invalid link</h2>
          <p className="mb-4 text-sm text-gray-500">This reset link is missing or malformed.</p>
          <Link to="/forgot-password" className="text-sm font-semibold text-orange-500 hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm)  { setError("Passwords do not match"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2">
            <VyaparIQLogo size={36} />
            <span className="text-lg font-extrabold text-gray-900 dark:text-white">{APP_NAME}</span>
          </div>

          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h2 className="mb-2 text-xl font-extrabold text-gray-900 dark:text-white">Password reset!</h2>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Your password has been updated. Redirecting to sign in…
              </p>
              <Link to="/login" className="text-sm font-semibold text-orange-500 hover:underline">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-2xl font-extrabold text-gray-900 dark:text-white">Set new password</h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Choose a strong password for your account.
              </p>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    New password
                  </label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      placeholder="Min. 6 characters"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-12 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConf ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-12 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConf((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConf ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 disabled:opacity-70"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Saving…
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
