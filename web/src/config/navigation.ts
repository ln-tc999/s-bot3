import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsLeftRightIcon,
  ChartPieSliceIcon,
  CompassIcon,
  HouseIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: HouseIcon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/swap", label: "Trade", icon: ArrowsLeftRightIcon },
  { href: "/create", label: "Create", icon: PlusCircleIcon },
  { href: "/portfolio", label: "Portfolio", icon: ChartPieSliceIcon },
];

export const indexHref = (label: string): string => `/indexes/${label}`;

export const swapHref = (label: string): string => `/swap?index=${label}`;
