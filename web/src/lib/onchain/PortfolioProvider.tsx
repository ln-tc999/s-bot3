"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { erc20Abi, formatUnits } from "viem";
import { publicClient, readOrFallback } from "@/lib/chain/client";
import { QUOTE, QUOTE_PRICE_USD, quoteAddress } from "@/lib/chain/quote";
import type { LiveIndex } from "@/lib/chain/registry";
import { indexVaultAbi, SHARE_DECIMALS } from "@/lib/chain/vault";
import type { PortfolioPosition } from "@/lib/portfolio";
import { useWallet } from "./WalletProvider";

const SHARE_UNIT = 10n ** BigInt(SHARE_DECIMALS);

export const toFloat = (value: bigint, decimals: number): number =>
  Number(formatUnits(value, decimals));

interface PortfolioContextValue {
  liveIndexes: LiveIndex[];
  /** Share balance per label, in the vault's own 18 decimal units. */
  shares: Record<string, bigint>;
  /** Quote units per whole share, as the vault itself reports it. */
  sharePrices: Record<string, bigint>;
  /** Balance of the one asset every vault settles in. */
  quoteBalance: bigint;
  positions: PortfolioPosition[];
  totalValueUsd: number;
  isLoading: boolean;
}

const EMPTY: PortfolioContextValue = {
  liveIndexes: [],
  shares: {},
  sharePrices: {},
  quoteBalance: 0n,
  positions: [],
  totalValueUsd: 0,
  isLoading: false,
};

const PortfolioContext = createContext<PortfolioContextValue>(EMPTY);

interface PortfolioProviderProps {
  liveIndexes: LiveIndex[];
  children: ReactNode;
}

export const PortfolioProvider = ({
  liveIndexes,
  children,
}: PortfolioProviderProps) => {
  const { address, epoch } = useWallet();
  const [shares, setShares] = useState<Record<string, bigint>>({});
  const [sharePrices, setSharePrices] = useState<Record<string, bigint>>({});
  const [quoteBalance, setQuoteBalance] = useState(0n);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Flattened to a string so the effect depends on the vault list's contents
   * rather than the array identity a server render hands over fresh each time.
   */
  const vaultKey = liveIndexes
    .flatMap((entry) => (entry.vault ? [`${entry.label}:${entry.vault}`] : []))
    .join(",");

  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch is the refetch trigger a write bumps, not a value this effect reads
  useEffect(() => {
    const quote = quoteAddress();

    if (!vaultKey && !quote) {
      return;
    }

    const vaults = vaultKey
      ? vaultKey.split(",").map((entry) => {
          const [label, vault] = entry.split(":");
          return { label, vault: vault as `0x${string}` };
        })
      : [];

    let cancelled = false;
    setIsLoading(true);

    /**
     * Individual reads rather than one multicall. Multicall3 is not deployed at
     * the canonical address on BOT Chain testnet, and viem refuses outright
     * ("Chain does not support contract multicall3") — which the catch below
     * would have swallowed, leaving every balance and price silently at zero.
     * An index list is a handful of entries, so the extra round trips are
     * cheaper than a dependency on a helper contract that may not be there.
     */
    const sharePrice = (vault: `0x${string}`) =>
      readOrFallback(
        `sharePrice(${vault})`,
        publicClient.readContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "sharePrice",
        }),
        0n,
      );

    const balanceOf = (token: `0x${string}`, owner: `0x${string}`) =>
      readOrFallback(
        `balanceOf(${token})`,
        publicClient.readContract({
          address: token,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [owner],
        }),
        0n,
      );

    Promise.all([
      Promise.all(vaults.map((entry) => sharePrice(entry.vault))),
      address
        ? Promise.all(vaults.map((entry) => balanceOf(entry.vault, address)))
        : Promise.resolve([] as bigint[]),
      address && quote ? balanceOf(quote, address) : Promise.resolve(0n),
    ])
      .then(([prices, shareBalances, quoteHeld]) => {
        if (cancelled) {
          return;
        }

        setSharePrices(
          Object.fromEntries(
            vaults.map((entry, position) => [entry.label, prices[position]]),
          ),
        );
        setShares(
          Object.fromEntries(
            vaults.map((entry, position) => [
              entry.label,
              shareBalances[position] ?? 0n,
            ]),
          ),
        );
        setQuoteBalance(quoteHeld);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, epoch, vaultKey]);

  const value = useMemo<PortfolioContextValue>(() => {
    const positions = liveIndexes.flatMap((entry) => {
      const balance = shares[entry.label] ?? 0n;

      if (balance === 0n) {
        return [];
      }

      const quoteAmount =
        (balance * (sharePrices[entry.label] ?? 0n)) / SHARE_UNIT;

      return [
        {
          index: entry,
          units: toFloat(balance, SHARE_DECIMALS),
          valueUsd: toFloat(quoteAmount, QUOTE.decimals) * QUOTE_PRICE_USD,
        } satisfies PortfolioPosition,
      ];
    });

    return {
      liveIndexes,
      shares,
      sharePrices,
      quoteBalance,
      positions,
      totalValueUsd: positions.reduce(
        (total, position) => total + position.valueUsd,
        0,
      ),
      isLoading,
    };
  }, [isLoading, liveIndexes, quoteBalance, sharePrices, shares]);

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextValue =>
  useContext(PortfolioContext);
