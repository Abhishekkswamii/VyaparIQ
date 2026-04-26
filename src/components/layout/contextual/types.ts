import type { CategoryId } from "@/components/layout/CategoryBar";

export interface ContextHeaderProps {
  activeCategory: CategoryId;
  onCategoryChange: (c: CategoryId) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  orderSearch: string;
  onOrderSearch: (q: string) => void;
  dateRange: string;
  onDateChange: (r: string) => void;
}
