"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatAmount, formatUsd, truncateAddress } from "@/lib/format";

const ROW_CLASS = "flex items-center justify-between gap-4";

interface SwapSummaryProps {
  paySymbol: string;
  receiveSymbol: string;
  rate: number;
  unitPriceUsd: number;
  vault: `0x${string}` | null;
}

/** The rate is the one number worth reading every time; the rest is on request. */
export const SwapSummary = ({
  paySymbol,
  receiveSymbol,
  rate,
  unitPriceUsd,
  vault,
}: SwapSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="px-1">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-1 text-sm text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
      >
        <span className="truncate tabular-nums">
          {`1 ${paySymbol} = ${formatAmount(rate)} ${receiveSymbol}`}
        </span>
        <CaretDownIcon
          size={14}
          weight="bold"
          aria-hidden
          className={cn(
            "shrink-0 text-ink-subtle transition-transform duration-150 ease-out",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <dl className="mt-3 space-y-2.5 border-t border-line pt-3 text-sm">
          <div className={ROW_CLASS}>
            <dt className="text-ink-subtle">Share price</dt>
            <dd className="tabular-nums text-ink">{formatUsd(unitPriceUsd)}</dd>
          </div>
          <div className={ROW_CLASS}>
            <dt className="text-ink-subtle">Fee</dt>
            <dd className="tabular-nums text-positive">0.00%</dd>
          </div>
          <div className={ROW_CLASS}>
            <dt className="text-ink-subtle">Settles in</dt>
            <dd className="font-mono text-xs text-ink">
              {vault ? truncateAddress(vault) : "—"}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
};
