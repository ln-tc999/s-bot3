import type { Metadata } from "next";
import { DashboardPage } from "@/components/pages/dashboard";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `Your positions across every ${SITE.name} index.`,
};

export default function DashboardRoute() {
  return <DashboardPage />;
}
