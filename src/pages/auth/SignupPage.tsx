import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import VyaparIQLogo from "@/components/ui/VyaparIQLogo";
import { useAuthStore } from "@/store/auth-store";
import { APP_NAME } from "@/constants/branding";

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

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
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
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setApiError(null);
    try {
      await signup(firstName.trim(), lastName.trim(), email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
            <VyaparIQLogo size={48} className="rounded-2xl shadow-lg" />
            <span className="text-3xl font-extrabold tracking-tight">{APP_NAME}</span>
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
              <VyaparIQLogo size={28} />
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">{APP_NAME}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create account</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Start your smart shopping journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                {apiError}
              </div>
            )}
            {/* First Name + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }}
                  placeholder="Alex"
                  className={`w-full rounded-xl border bg-white py-3 px-4 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 dark:bg-gray-900 dark:text-white ${
                    errors.firstName
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700"
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle size={12} />{errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }}
                  placeholder="Johnson"
                  className={`w-full rounded-xl border bg-white py-3 px-4 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 dark:bg-gray-900 dark:text-white ${
                    errors.lastName
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700"
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle size={12} />{errors.lastName}
                  </p>
                )}
              </div>
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
              className="font-semibold text-orange-500 transition-colors hover:text-orange-600 hover:underline"
            >
              Sign in
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
            Sign up with Google
          </a>
        </motion.div>
      </div>
    </div>
  );
}
