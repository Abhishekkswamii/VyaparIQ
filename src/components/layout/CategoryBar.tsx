import { useRef } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Leaf,
  Cpu,
  Shirt,
  Tag,
} from "lucide-react";

export const CATEGORIES = [
  { id: "All", label: "All", icon: LayoutGrid },
  { id: "Grocery", label: "Grocery", icon: Leaf },
  { id: "Electronics", label: "Electronics", icon: Cpu },
  { id: "Fashion", label: "Fashion", icon: Shirt },
  { id: "Budget Deals", label: "Budget Deals", icon: Tag },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

interface CategoryBarProps {
  active: CategoryId;
  onChange: (cat: CategoryId) => void;
}

export default function CategoryBar({ active, onChange }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-[var(--nav-height)] z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div
        ref={scrollRef}
        className="scrollbar-hide mx-auto flex max-w-[1440px] items-center gap-0.5 overflow-x-auto px-4 sm:px-6 lg:px-8"
      >
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={14} className={isActive ? "text-orange-500" : "text-gray-400"} />
              {label}
              {isActive && (
                <motion.span
                  layoutId="cat-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-orange-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
