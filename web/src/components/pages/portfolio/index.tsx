"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { usePortfolio } from "@/lib/onchain/PortfolioProvider";
import { getPortfolioAllocation } from "@/lib/portfolio";
import { PortfolioSplit } from "./components/PortfolioSplit";

export const PortfolioPage = () => {
  const { positions, totalValueUsd } = usePortfolio();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Every index you hold, its unit balance and what it adds up to."
      />

      <PortfolioSplit
        positions={positions}
        totalValueUsd={totalValueUsd}
        allocation={getPortfolioAllocation(positions)}
      />
    </div>
  );
};
