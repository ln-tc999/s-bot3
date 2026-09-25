import { cn } from "@/lib/cn";
import { formatUsdCompact } from "@/lib/format";

interface LiquidityTileProps {
  totalUsd: number;
  vaultCount: number;
  className?: string;
}

/**
 * A fact rather than a filter: what every live vault holds right now, read
 * from share supply times share price. Shares the facet tiles' frame so the
 * row still reads as one band of cards.
 */
export const LiquidityTile = ({
  totalUsd,
  vaultCount,
  className,
}: LiquidityTileProps) => (
  <div
    className={cn(
      "flex h-[213px] flex-col items-center justify-center gap-4 rounded-2xl border border-line/60 bg-surface-subtle/80 p-6",
      className,
    )}
  >
    <div className="flex h-12 items-center justify-center">
      <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
        {formatUsdCompact(totalUsd)}
      </span>
    </div>
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-sm font-semibold tracking-tight text-ink-muted">
        Total liquidity
      </span>
      <span className="rounded-full bg-surface-hover/70 px-2.5 py-0.5 font-mono text-xs font-medium tabular-nums text-ink-subtle">
        {vaultCount} {vaultCount === 1 ? "vault" : "vaults"} live
      </span>
    </div>
  </div>
);
