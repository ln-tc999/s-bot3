"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsLeftRightIcon,
  CheckIcon,
  CompassIcon,
  CopyIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { TokenStack } from "@/components/ui/TokenStack";
import { activeChain } from "@/lib/chain/chains";
import { cn } from "@/lib/cn";
import { formatUsd, truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";
import type { AllocationSlice } from "@/lib/portfolio";
import type { Constituent } from "@/types/index-fund";

const MAX_STACKED = 4;
const COPIED_MS = 1600;

const ACTIONS: ReadonlyArray<{ href: string; label: string; icon: Icon }> = [
  { href: "/swap", label: "Swap", icon: ArrowsLeftRightIcon },
  { href: "/create", label: "Create", icon: PlusIcon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
];

interface PortfolioHeroProps {
  totalValueUsd: number;
  indexCount: number;
  allocation: AllocationSlice[];
}

/** The stack wants weights; look-through shares already are weights. */
const toStack = (allocation: AllocationSlice[]): Constituent[] =>
  allocation.map((slice) => ({
    token: slice.token,
    weightBps: slice.shareBps,
  }));

const CopyAddress = ({ address }: { address: `0x${string}` }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      /* Clipboard is blocked in some contexts; the address is on screen anyway. */
    }
  };

  const CopyStateIcon = copied ? CheckIcon : CopyIcon;

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy address"
      className="soft-badge rounded-xl bg-surface-subtle p-2 text-ink-muted transition-colors duration-150 ease-out hover:bg-surface hover:text-ink"
    >
      <CopyStateIcon
        size={16}
        weight={copied ? "bold" : "regular"}
        aria-hidden
        className={cn(copied && "text-positive")}
      />
      <span className="sr-only">
        {copied ? "Address copied" : "Copy address"}
      </span>
    </button>
  );
};

export const PortfolioHero = ({
  totalValueUsd,
  indexCount,
  allocation,
}: PortfolioHeroProps) => {
  const { address } = useWallet();
  const stack = toStack(allocation);

  return (
    <section className="soft-shell rounded-[1.75rem] bg-surface p-2.5">
      <div className="wallet-mesh relative overflow-hidden rounded-[1.35rem] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-ink-muted">Portfolio</p>
            <p className="mt-0.5 truncate font-mono text-sm font-medium text-ink">
              {address ? truncateAddress(address) : "Not connected"}
            </p>
          </div>
          {address ? <CopyAddress address={address} /> : null}
        </div>

        <p className="mt-6 text-5xl font-semibold tracking-tighter tabular-nums text-ink sm:text-6xl">
          {formatUsd(totalValueUsd)}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {stack.length > 0 ? (
            <span className="flex items-center gap-2.5">
              <TokenStack
                constituents={stack}
                size="md"
                maxVisible={MAX_STACKED}
              />
              <span className="text-xs text-ink-muted">
                {`${indexCount === 1 ? "1 index" : `${indexCount} indexes`} · ${activeChain.name}`}
              </span>
            </span>
          ) : (
            <span className="text-xs text-ink-muted">
              {address
                ? `No positions yet · ${activeChain.name}`
                : `Connect a wallet to see your positions · ${activeChain.name}`}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="soft-pill flex items-center gap-3 rounded-[1.15rem] bg-surface-subtle py-3 pr-4 pl-3"
          >
            <span className="soft-badge flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
              <action.icon size={16} weight="bold" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-ink">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
