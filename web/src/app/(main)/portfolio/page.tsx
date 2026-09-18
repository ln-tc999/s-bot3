import type { Metadata } from "next";
import { PortfolioPage } from "@/components/pages/portfolio";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Every index you hold, its unit balance and what it adds up to.",
};

export default function PortfolioRoute() {
  return <PortfolioPage />;
}
