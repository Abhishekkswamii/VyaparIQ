import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, ShoppingCart, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!confirm) errs.confirm = "Please confirm your password";
    else if (confirm !== password) errs.confirm = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    await new Promise((res) => setTimeout(res, 900));
    login(email, name.trim());
    navigate("/dashboard");
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const PasswordStrength = () => {
    const len = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasNum = /\d/.test(password);
    const score = len >= 8 ? (hasUpper && hasNum ? 3 : hasUpper || hasNum ? 2 : 1) : len >= 6 ? 1 : 0;
    if (!password) return null;
    const colors = ["bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"];
    const labels = ["Weak", "Fair", "Good", "Strong"];
    return (
      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= score - 1 ? colors[score - 1] : "bg-gray-200 dark:bg-gray-700"}`}
            />
          ))}
        </div>
        <span className={`text-[11px] font-semibold ${["text-red-500", "text-amber-500", "text-blue-500", "text-orange-500"][score - 1] ?? "text-gray-400"}`}>
          {labels[score - 1] ?? ""}
        </span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left brand panel */}
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
            <span className="text-3xl font-extrabold tracking-tight">SmartCart AI</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-snug">
            Join thousands of<br />smart shoppers.
          </h2>
          <p className="mt-4 text-lg font-light leading-relaxed text-emerald-100">
            Create your free account and start managing your shopping budget intelligently.
          </p>
          <div className="mt-10 space-y-6">
            {[
              { step: "1", title: "Create account", desc: "Sign up in under 30 seconds" },
              { step: "2", title: "Set your budget", desc: "Define your spending limit" },
              { step: "3", title: "Shop smarter", desc: "Add items and track in real time" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {step}
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-orange-100">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <div className="mb-5 flex items-center gap-2 lg:hidden">
              <ShoppingCart size={26} className="text-orange-500" />
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">SmartCart AI</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create account</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Start your smart shopping journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Full name
              </label>
              <div className="relative">
                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError("name"); }}
                  placeholder="Alex Johnson"
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 dark:bg-gray-900 dark:text-white ${
                    errors.name
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle size={12} />{errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
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
                  <AlertCircle size={12} />{errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                  placeholder="Min. 6 characters"
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
              <PasswordStrength />
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle size={12} />{errors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Confirm password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clearError("confirm"); }}
                  placeholder="Repeat your password"
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 dark:bg-gray-900 dark:text-white ${
                    errors.confirm
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirm && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle size={12} />{errors.confirm}
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
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-orange-500 transition-colors hover:text-orange-600 hover:underline text-orange-400"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
