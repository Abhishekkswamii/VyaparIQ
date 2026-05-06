import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Wallet, BarChart3, Bell, Sparkles, PieChart, ShoppingBag,
  CheckCircle2, ChevronDown, ArrowRight, Star, Menu, X, Zap,
  Users, Mail, Globe, Code2, Share2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

// ── Navbar ────────────────────────────────────────────────────────────────────

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["Features", "How It Works", "Why Us", "FAQ"];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm dark:bg-gray-950/90" : "bg-transparent"
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="VyaparIQ" width={34} height={34} className="rounded-xl" />
          <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
            Vyapar<span className="text-orange-500">IQ</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm font-medium text-gray-600 transition hover:text-orange-500 dark:text-gray-300">
              {l}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
            Login
          </Link>
          <Link to="/signup" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition hover:bg-orange-600">
            Sign Up Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 md:hidden" aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950 md:hidden">
            {links.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                {l}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold dark:border-gray-700">Login</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="rounded-xl bg-orange-500 py-2.5 text-center text-sm font-semibold text-white">Sign Up Free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 pt-24 pb-20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="mx-auto max-w-3xl text-center">
          <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
            <Sparkles size={14} /> AI-Powered Smart Shopping
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl font-extrabold leading-[1.15] tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
            Shop Smarter.{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Spend Wiser.
            </span>{" "}
            Save More.
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
            VyaparIQ is an AI-powered smart shopping platform that helps you manage budgets,
            track spending in real-time, get personalised product suggestions, and receive
            intelligent alerts — so every rupee works harder.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup"
              className="flex items-center gap-2 rounded-2xl bg-orange-500 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition hover:bg-orange-600 hover:shadow-orange-500/50">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-8 py-3.5 text-base font-bold text-gray-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              Sign In
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="mt-16 grid grid-cols-3 gap-4 sm:gap-8">
            {[["500+", "Products"], ["₹0", "Hidden Fees"], ["100%", "Privacy"]].map(([val, label]) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                <p className="text-2xl font-extrabold text-orange-500 sm:text-3xl">{val}</p>
                <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Bot,         color: "from-purple-500 to-violet-600", title: "AI Shopping Assistant",        desc: "Vyra, your personal AI agent, adds items, answers queries, and places orders through natural conversation." },
  { icon: Wallet,      color: "from-orange-500 to-amber-500",  title: "Smart Budget Tracking",        desc: "Set monthly limits and watch your remaining budget update instantly as you shop." },
  { icon: BarChart3,   color: "from-blue-500 to-cyan-500",     title: "Real-Time Expense Monitor",    desc: "Every purchase is logged and visualised — see exactly where your money goes as it happens." },
  { icon: Bell,        color: "from-red-500 to-rose-500",      title: "Over-Budget Alerts",           desc: "Get instant warnings when your cart or spending exceeds your set budget threshold." },
  { icon: Sparkles,    color: "from-emerald-500 to-teal-500",  title: "Product Recommendations",      desc: "AI suggests products that fit your budget and shopping history, saving you time and money." },
  { icon: PieChart,    color: "from-indigo-500 to-purple-500", title: "Category Spending Analysis",   desc: "Drill down by category to understand your spending patterns and optimise your purchases." },
  { icon: ShoppingBag, color: "from-pink-500 to-rose-500",     title: "Smart Cart Optimisation",      desc: "Budget optimiser trims your cart to fit your limit while keeping the highest-value items." },
];

function Features() {
  return (
    <section id="features" className="bg-white py-24 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mb-16 text-center">
          <motion.p variants={fadeUp} className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-500">Features</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-gray-900 dark:text-white">Everything you need to shop smart</motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
            Powerful tools that turn your everyday shopping into an intelligent, budget-aware experience.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-md`}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="mb-2 font-bold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", title: "Create Account",              desc: "Sign up free with email or Google in under 30 seconds.", icon: Users },
  { n: "02", title: "Set Your Budget",             desc: "Define your monthly shopping budget and alert thresholds.", icon: Wallet },
  { n: "03", title: "Add Products to Cart",        desc: "Browse, search, scan barcodes, or ask Vyra to add items.", icon: ShoppingBag },
  { n: "04", title: "AI Tracks & Optimises",       desc: "VyaparIQ monitors every rupee and keeps your spending on track.", icon: Zap },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gradient-to-br from-gray-50 to-orange-50/30 py-24 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mb-16 text-center">
          <motion.p variants={fadeUp} className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-500">How It Works</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-gray-900 dark:text-white">Up and running in 4 steps</motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} variants={fadeUp} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute top-8 left-full z-10 hidden h-0.5 w-full -translate-x-1/2 bg-gradient-to-r from-orange-300 to-orange-100 lg:block" />
              )}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl font-black text-orange-100 dark:text-orange-900">{s.n}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 shadow-md shadow-orange-500/30">
                    <s.icon size={18} className="text-white" />
                  </div>
                </div>
                <h3 className="mb-2 font-bold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Why Choose ────────────────────────────────────────────────────────────────

const COMPARE = [
  ["Budget Awareness",        true,  false],
  ["AI Recommendations",      true,  false],
  ["Spending Analytics",      true,  false],
  ["Smart Alerts",            true,  false],
  ["Cost Optimisation",       true,  false],
  ["Barcode Scanner",         true,  false],
  ["Natural Language Orders", true,  false],
];

function WhyUs() {
  return (
    <section id="why-us" className="bg-white py-24 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mb-12 text-center">
          <motion.p variants={fadeUp} className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-500">Why Choose Us</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-gray-900 dark:text-white">VyaparIQ vs Traditional Apps</motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm dark:border-gray-800">
            {/* Header */}
            <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-900">
              <div className="p-4 text-sm font-bold text-gray-500 dark:text-gray-400">Feature</div>
              <div className="p-4 text-center text-sm font-bold text-orange-500">VyaparIQ</div>
              <div className="p-4 text-center text-sm font-bold text-gray-400">Traditional Apps</div>
            </div>
            {COMPARE.map(([feat, ours, theirs], i) => (
              <div key={String(feat)} className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50/50 dark:bg-gray-900/50"}`}>
                <div className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">{String(feat)}</div>
                <div className="flex items-center justify-center p-4">
                  {ours ? <CheckCircle2 size={20} className="text-emerald-500" /> : <X size={16} className="text-gray-300" />}
                </div>
                <div className="flex items-center justify-center p-4">
                  {theirs ? <CheckCircle2 size={20} className="text-emerald-500" /> : <X size={16} className="text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Mock Preview ──────────────────────────────────────────────────────────────

function Preview() {
  return (
    <section className="overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mb-12 text-center">
          <motion.p variants={fadeUp} className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-500">App Preview</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white">See it in action</motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-gray-400">
            A real-time dashboard that puts your entire shopping budget at your fingertips.
          </motion.p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-gray-700 bg-gray-800 shadow-2xl shadow-black/50">
          {/* Window bar */}
          <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-900 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-3 text-xs text-gray-500">vyapariq.web.app/dashboard</span>
          </div>
          {/* Mock dashboard */}
          <div className="p-6">
            {/* Budget bar */}
            <div className="mb-6 rounded-2xl bg-gray-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">Monthly Budget</span>
                <span className="text-sm font-bold text-orange-400">₹1,850 left of ₹5,000</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-700">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "63%" }}
                  viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>₹3,150 spent</span><span>63% used</span>
              </div>
            </div>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[["₹3,150", "Spent This Month", "text-orange-400"],
                ["12", "Orders Placed", "text-blue-400"],
                ["₹420", "Saved by AI", "text-emerald-400"]].map(([v, l, c]) => (
                <div key={l} className="rounded-xl bg-gray-900 p-3 text-center">
                  <p className={`text-xl font-extrabold ${c}`}>{v}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{l}</p>
                </div>
              ))}
            </div>
            {/* AI chat bubble */}
            <div className="rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500">
                  <Bot size={14} className="text-white" />
                </div>
                <span className="text-sm font-bold text-orange-400">Vyra — AI Assistant</span>
              </div>
              <p className="text-sm text-gray-300">
                "Hi! You've used 63% of your budget. I found 3 cheaper alternatives for items in your cart that can save you ₹240 — want me to swap them?"
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "College Student, Delhi", text: "VyaparIQ completely changed how I manage my monthly expenses. The AI suggestions are surprisingly accurate!", rating: 5 },
  { name: "Rajan Mehta",  role: "Home Maker, Mumbai",    text: "I used to overspend every month. Now with budget alerts I save almost ₹3000 monthly. Incredible app!", rating: 5 },
  { name: "Ananya Singh", role: "IT Professional, Bangalore", text: "The Vyra AI agent is mind-blowing. I just say 'add 2kg rice' and it's done. Shopping has never been easier.", rating: 5 },
];

function Testimonials() {
  return (
    <section className="bg-gradient-to-br from-orange-50 to-amber-50/30 py-24 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mb-12 text-center">
          <motion.p variants={fadeUp} className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-500">Testimonials</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-gray-900 dark:text-white">What our users say</motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={fadeUp}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 font-bold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "How does budget tracking work?", a: "You set a monthly limit. Every time you add to cart or place an order, VyaparIQ deducts the amount in real-time and shows your remaining budget as a live pill in the navbar." },
  { q: "Is the AI recommendation accurate?", a: "Yes. Vyra analyses your shopping history, budget, and product catalog to suggest the most cost-effective options that match your preferences." },
  { q: "Can I track category-wise spending?", a: "Absolutely. The Analytics dashboard breaks down your spending by category — Groceries, Electronics, Dairy, etc. — with charts and trend lines." },
  { q: "Is my data safe?", a: "VyaparIQ stores all data securely with encrypted tokens and zero hidden fees. We never sell your data to third parties." },
  { q: "Can I use VyaparIQ without AI?", a: "Yes. All features work independently. AI is an optional layer that enhances your experience — you can shop manually anytime." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="bg-white py-24 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mb-12 text-center">
          <motion.p variants={fadeUp} className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-500">FAQ</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-gray-900 dark:text-white">Frequently Asked Questions</motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="space-y-3">
          {FAQS.map((f, i) => (
            <motion.div key={i} variants={fadeUp}
              className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left font-semibold text-gray-900 dark:text-white">
                <span className="text-sm">{f.q}</span>
                <ChevronDown size={18} className={`shrink-0 text-orange-500 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden border-t border-gray-100 dark:border-gray-800">
                    <p className="p-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="bg-gradient-to-r from-orange-500 to-amber-500 py-20">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white">
          Ready to shop smarter?
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-4 text-lg text-orange-100">
          Join thousands of smart shoppers. It's free, fast, and AI-powered.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/signup"
            className="flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 font-bold text-orange-600 shadow-lg transition hover:shadow-xl">
            Create Free Account <ArrowRight size={18} />
          </Link>
          <Link to="/login"
            className="flex items-center gap-2 rounded-2xl border-2 border-white/40 px-8 py-3.5 font-bold text-white transition hover:bg-white/10">
            Sign In
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-950 py-16 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <img src="/logo.svg" alt="VyaparIQ" width={32} height={32} className="rounded-xl" />
              <span className="text-lg font-extrabold text-white">Vyapar<span className="text-orange-500">IQ</span></span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500">
              AI-powered smart shopping that keeps every rupee under control.
            </p>
            <div className="mt-5 flex gap-3">
              {[[Share2, "Twitter"], [Code2, "GitHub"], [Globe, "LinkedIn"], [Mail, "Email"]].map(([Icon, label]) => (
                <button key={String(label)} aria-label={String(label)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-800 text-gray-500 transition hover:border-orange-500 hover:text-orange-500">
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Product</p>
            {["Features", "How It Works", "Pricing", "Changelog"].map((l) => (
              <a key={l} href="#" className="mb-2 block text-sm text-gray-500 transition hover:text-orange-400">{l}</a>
            ))}
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Company</p>
            {[["About", "#"], ["Privacy Policy", "#"], ["Terms of Service", "#"], ["Contact", "#"]].map(([l, h]) => (
              <a key={l} href={h} className="mb-2 block text-sm text-gray-500 transition hover:text-orange-400">{l}</a>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} VyaparIQ. All rights reserved. · Built with ❤️ for smart shoppers.
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const isLoggedIn = useAuthStore((s) => !!s.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard", { replace: true });
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <WhyUs />
      <Preview />
      <Testimonials />
      <CTABanner />
      <FAQ />
      <Footer />
    </div>
  );
}
