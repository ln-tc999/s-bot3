"use client";

import { AllocationCard } from "@/components/portfolio/AllocationCard";
import { usePortfolio } from "@/lib/onchain/PortfolioProvider";
import { getPortfolioAllocation } from "@/lib/portfolio";
import { PortfolioHero } from "./components/PortfolioHero";
import { PositionList } from "./components/PositionList";

export const DashboardPage = () => {
  const { positions, totalValueUsd } = usePortfolio();
  const allocation = getPortfolioAllocation(positions);

  return (
    <div className="space-y-6">
      <PortfolioHero
        totalValueUsd={totalValueUsd}
        indexCount={positions.length}
        allocation={allocation}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PositionList positions={positions} />
        </div>
        <div className="lg:col-span-2">
          <AllocationCard allocation={allocation} />
        </div>
      </div>
    </div>
  );
};
