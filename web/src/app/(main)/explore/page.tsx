import type { Metadata } from "next";
import { ExplorePage } from "@/components/pages/explore";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Explore",
  description: SITE.description,
};

interface ExploreRouteProps {
  searchParams: Promise<{ collection?: string }>;
}

export default async function ExploreRoute({
  searchParams,
}: ExploreRouteProps) {
  const { collection } = await searchParams;

  return <ExplorePage collection={collection} />;
}
