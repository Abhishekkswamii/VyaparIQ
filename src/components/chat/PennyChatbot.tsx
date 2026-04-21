import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = ["What's my budget?", "Show deals", "Help"];

export default function PennyChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Penny 🪙 — your smart shopping assistant. Ask me about your cart, budget, or deals!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalPrice = useCartStore((s) => s.totalPrice);
  const items = useCartStore((s) => s.items);
  const budget = useBudgetStore((s) => s.budget);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    let reply: string;
    try {
      const res = await fetch("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          cart_total: totalPrice(),
          budget,
          item_count: items.length,
          history: messages.slice(-6),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reply = data.reply;
      } else {
        reply = fallbackReply(text);
      }
    } catch {
      reply = fallbackReply(text);
    }

    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-700 hover:scale-105 active:scale-95"
            aria-label="Chat with Penny"
          >
            <MessageCircle size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 left-5 z-[96] flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-violet-600 px-4 py-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-white" />
                <div>
                  <p className="text-sm font-bold text-white">Penny</p>
                  <p className="text-[10px] text-violet-200">Smart assistant</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-violet-200 hover:bg-violet-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "rounded-br-md bg-orange-500 text-white"
                        : "rounded-bl-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 dark:bg-gray-800">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="flex gap-1.5 border-t border-gray-100 px-4 py-2 dark:border-gray-800">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-violet-600"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Ask Penny..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-violet-500/20"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white transition-all hover:bg-violet-700 disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Local fallback when AI service is unavailable
function fallbackReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("budget")) return "Set your budget on the Overview page, then I'll track it for you!";
  if (t.includes("deal") || t.includes("offer")) return "Try FRESH10, DAIRY15, SAVE50, or MEGA20 coupon codes!";
  if (t.includes("help")) return "I can help with budget tracking, coupons & deals, and cart summaries.";
  return "I'm not sure about that. Try asking about your budget, deals, or cart!";
}
