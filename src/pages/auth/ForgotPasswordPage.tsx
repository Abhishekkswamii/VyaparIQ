import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import VyaparIQLogo from "@/components/ui/VyaparIQLogo";
import { APP_NAME } from "@/constants/branding";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
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
        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2">
            <VyaparIQLogo size={36} />
            <span className="text-lg font-extrabold text-gray-900 dark:text-white">{APP_NAME}</span>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h2 className="mb-2 text-xl font-extrabold text-gray-900 dark:text-white">Check your inbox</h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                If <span className="font-semibold text-orange-500">{email}</span> is registered, you'll receive a password reset link within a few minutes.
              </p>
              <p className="mb-6 text-xs text-gray-400">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 hover:underline"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <h2 className="mb-1 text-2xl font-extrabold text-gray-900 dark:text-white">Forgot password?</h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
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
                      Sending…
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </motion.button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Remember your password?{" "}
                <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
