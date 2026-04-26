import { useLocation } from "react-router-dom";
import type { ContextHeaderProps } from "./contextual/types";
import DashboardHeader from "./contextual/DashboardHeader";
import CartHeader from "./contextual/CartHeader";
import OrdersHeader from "./contextual/OrdersHeader";
import AnalyticsHeader from "./contextual/AnalyticsHeader";

export type { ContextHeaderProps };

/**
 * Config-driven contextual header registry.
 * Add a new route → component entry here to extend without touching AppLayout.
 */
const HEADER_REGISTRY: Record<string, React.ComponentType<ContextHeaderProps>> = {
  "/dashboard": DashboardHeader,
  "/shop": DashboardHeader,
  "/cart": CartHeader,
  "/orders": OrdersHeader,
  "/analytics": AnalyticsHeader,
};

export default function ContextHeader(props: ContextHeaderProps) {
  const { pathname } = useLocation();
  const Header = HEADER_REGISTRY[pathname];
  if (!Header) return null;
  return <Header {...props} />;
}
