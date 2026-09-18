import type { Metadata } from "next";
import { SwapPage } from "@/components/pages/swap";

export const metadata: Metadata = {
  title: "Swap",
  description:
    "Deposit, redeem and switch between index share tokens on BOT Chain.",
};

interface SwapRouteProps {
  searchParams: Promise<{ index?: string }>;
}

export default async function SwapRoute({ searchParams }: SwapRouteProps) {
  const { index } = await searchParams;

  return <SwapPage indexSlug={index} />;
}
