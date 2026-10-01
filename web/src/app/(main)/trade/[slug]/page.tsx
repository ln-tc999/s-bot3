import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TradeDetailPage } from "@/components/pages/trade-detail";
import { fetchIndex } from "@/lib/chain/registry";
import { selectedChainId } from "@/lib/chain/selected.server";

/** Balances are read in the browser; only the record is cached. */
export const revalidate = 30;

interface TradeRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TradeRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const index = await fetchIndex(slug, await selectedChainId()).catch(
    () => null,
  );

  return index
    ? { title: `Trade ${index.name}` }
    : { title: "Index not found" };
}

export default async function TradeDetailRoute({ params }: TradeRouteProps) {
  const { slug } = await params;
  const chainId = await selectedChainId();
  const index = await fetchIndex(slug, chainId).catch(() => null);

  if (!index) {
    notFound();
  }

  return <TradeDetailPage index={index} chainId={chainId} />;
}
