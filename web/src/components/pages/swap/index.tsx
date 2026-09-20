"use client";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePortfolio } from "@/lib/onchain/PortfolioProvider";
import { SwapArtPanel } from "./components/SwapArtPanel";
import { SwapCard } from "./components/SwapCard";

interface SwapPageProps {
  indexSlug?: string;
}

export const SwapPage = ({ indexSlug }: SwapPageProps) => {
  const { liveIndexes } = usePortfolio();
  const initial =
    liveIndexes.find((entry) => entry.label === indexSlug) ?? liveIndexes[0];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Swap into an index"
        description="Trade any supported asset for a whole crypto index in a single transaction."
        action={
          <ButtonLink href="/explore" variant="secondary">
            Browse indexes
          </ButtonLink>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <SwapArtPanel />
        <Card className="p-5">
          {initial ? (
            <SwapCard initialSlug={initial.label} liveIndexes={liveIndexes} />
          ) : (
            <EmptyState
              title="No index is tradeable yet"
              description="An index becomes tradeable once its share token is attached on BOT Chain. Go to the index page and click Enable trading to publish one."
            />
          )}
        </Card>
      </div>
    </div>
  );
};
