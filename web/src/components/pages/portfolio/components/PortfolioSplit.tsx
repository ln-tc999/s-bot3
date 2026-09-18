"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AllocationRows } from "@/components/portfolio/AllocationRows";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import { activeChain } from "@/lib/chain/chains";
import { cn } from "@/lib/cn";
import { formatAmount, formatUsd, truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";
import type { AllocationSlice, PortfolioPosition } from "@/lib/portfolio";
import { getPortfolioValueUsd } from "@/lib/portfolio";
import { TOKENS } from "@/lib/tokens/registry";

const IMAGE_QUALITY = 90;
const COPIED_MS = 1600;
const BASIS_POINTS_PER_UNIT = 10_000;

/** Each index gets a band whose width is its share of the total. */
const AllocationBar = ({ positions }: { positions: PortfolioPosition[] }) => {
  const total = getPortfolioValueUsd(positions);

  if (total === 0) {
    return <span className="block h-2 rounded-full bg-canvas" />;
  }

  return (
    <span className="flex h-2 gap-0.5 overflow-hidden rounded-full">
      {positions.map((position, index) => (
        <span
          key={position.index.label}
          className={cn(
            "block h-full rounded-full",
            index === 0 ? "bg-accent" : "bg-accent/55",
            index > 1 && "bg-accent/30",
          )}
          style={{ width: `${(position.valueUsd / total) * 100}%` }}
        />
      ))}
    </span>
  );
};

const WalletStrip = () => {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!address) {
    return (
      <p className="border-b border-line px-5 py-4 text-sm text-ink-muted">
        Not connected
      </p>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      /* Clipboard is blocked in some contexts; the address is on screen anyway. */
    }
  };

  const StateIcon = copied ? CheckIcon : CopyIcon;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
      <span className="flex min-w-0 items-center gap-3">
        <span className="size-8 shrink-0 rounded-full bg-accent" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate font-mono text-sm font-medium text-ink">
            {truncateAddress(address)}
          </span>
          <span className="block text-xs text-ink-subtle">
            {activeChain.name}
          </span>
        </span>
      </span>

      <button
        type="button"
        onClick={copy}
        title="Copy address"
        className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink"
      >
        <StateIcon
          size={16}
          weight={copied ? "bold" : "regular"}
          aria-hidden
          className={cn(copied && "text-positive")}
        />
        <span className="sr-only">
          {copied ? "Address copied" : "Copy address"}
        </span>
      </button>
    </div>
  );
};

interface PortfolioSplitProps {
  positions: PortfolioPosition[];
  totalValueUsd: number;
  allocation: AllocationSlice[];
}

export const PortfolioSplit = ({
  positions,
  totalValueUsd,
  allocation,
}: PortfolioSplitProps) => (
  <section className="soft-shell grid overflow-hidden rounded-[1.75rem] bg-surface lg:grid-cols-2">
    <div className="flex flex-col">
      <div className="space-y-5 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-ink-muted">Portfolio value</p>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-subtle py-1 pr-2.5 pl-1 text-xs font-medium text-ink-muted">
            <TokenIcon token={TOKENS.eth} size="sm" className="ring-0" />
            {activeChain.name}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-5xl font-semibold tracking-tighter tabular-nums text-ink">
            {formatUsd(totalValueUsd)}
          </p>
          <p className="text-sm text-ink-muted">
            Priced at what the vaults would pay to redeem it now.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-xs text-ink-subtle">
            <span>
              {positions.length === 1
                ? "1 index"
                : `${positions.length} indexes`}
            </span>
            <span className="tabular-nums">{formatUsd(totalValueUsd)}</span>
          </div>
          <AllocationBar positions={positions} />
        </div>
      </div>

      <div className="relative isolate min-h-56 flex-1">
        <Image
          src="/assets/cat-ui-bg-2.jpg"
          alt=""
          fill
          priority
          quality={IMAGE_QUALITY}
          sizes="(max-width: 1024px) 100vw, 32rem"
          className="object-cover object-center"
        />
      </div>
    </div>

    <div className="flex flex-col border-line lg:border-l">
      <div className="flex items-center justify-end gap-2 px-5 py-4">
        <ButtonLink href="/explore" variant="secondary" className="px-3.5 py-2">
          Explore
        </ButtonLink>
        <ButtonLink href="/swap" className="px-3.5 py-2">
          Deposit
        </ButtonLink>
      </div>

      <WalletStrip />

      <div className="flex flex-1 flex-col">
        <h2 className="px-5 pt-5 pb-3 text-sm font-semibold text-ink">
          Holdings
        </h2>

        {positions.length > 0 ? (
          <ul>
            {positions.map((position) => {
              const shareBps =
                totalValueUsd === 0
                  ? 0
                  : (position.valueUsd / totalValueUsd) * BASIS_POINTS_PER_UNIT;

              return (
                <li key={position.index.label} className="border-t border-line">
                  <Link
                    href={indexHref(position.index.label)}
                    className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-surface-hover"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <TokenStack
                        constituents={position.index.constituents}
                        size="sm"
                        maxVisible={3}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {position.index.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-mono text-xs text-ink-muted">
                            {position.index.label}
                          </span>
                        </span>
                        <span className="block truncate text-xs tabular-nums text-ink-subtle">
                          {`${formatAmount(position.units)} units · ${(shareBps / 100).toFixed(1)}%`}
                        </span>
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        {formatUsd(position.valueUsd)}
                      </span>
                      <ArrowRightIcon
                        size={14}
                        aria-hidden
                        className="text-ink-subtle transition-colors duration-150 ease-out group-hover:text-ink"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center border-t border-line">
            <EmptyState
              title="No holdings yet"
              description="Deposit into an index and it will appear here with its unit balance."
            />
          </div>
        )}

        {allocation.length > 0 ? (
          <div className="flex-1 border-t border-line px-5 pt-5 pb-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">
              Look through exposure
            </h2>
            <AllocationRows allocation={allocation} />
          </div>
        ) : null}
      </div>
    </div>
  </section>
);
