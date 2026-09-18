import { TokenIcon } from "@/components/ui/TokenIcon";
import { cn } from "@/lib/cn";
import { formatWeight } from "@/lib/format";
import type { AllocationSlice } from "@/lib/portfolio";

export const MAX_VISIBLE_SLICES = 5;

interface AllocationRowsProps {
  allocation: AllocationSlice[];
  className?: string;
}

/**
 * Just the rows. The dashboard frames them in a card and the portfolio hangs
 * them off its split panel, and neither wants the other's chrome.
 */
export const AllocationRows = ({
  allocation,
  className,
}: AllocationRowsProps) => (
  <ul className={cn("space-y-4", className)}>
    {allocation.slice(0, MAX_VISIBLE_SLICES).map((slice) => (
      <li key={slice.token.symbol} className="flex items-center gap-3">
        <TokenIcon token={slice.token} size="sm" />
        <span className="w-20 shrink-0 truncate text-sm font-medium text-ink">
          {slice.token.name}
        </span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
          <span
            className="block h-full rounded-full bg-accent"
            style={{ width: `${slice.shareBps / 100}%` }}
          />
        </span>
        <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
          {formatWeight(slice.shareBps)}
        </span>
      </li>
    ))}
  </ul>
);
