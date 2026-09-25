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
import { getPublicClient, readOrFallback } from "@/lib/chain/client";
import { fetchIndexes, type LiveIndex } from "@/lib/chain/registry";
import { UNIT_DECIMALS } from "@/lib/chain/unit";
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
  /**
   * Units of account per whole share, as the vault derives it from what it
   * actually holds. Rises with the fee and never falls.
   */
  navPerShare: Record<string, bigint>;
  positions: PortfolioPosition[];
  totalValueUsd: number;
  isLoading: boolean;
}

const EMPTY: PortfolioContextValue = {
  liveIndexes: [],
  shares: {},
  navPerShare: {},
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
  liveIndexes: initialLiveIndexes,
  children,
}: PortfolioProviderProps) => {
  const { address, epoch, chainId } = useWallet();
  const [liveIndexes, setLiveIndexes] =
    useState<LiveIndex[]>(initialLiveIndexes);
  const [shares, setShares] = useState<Record<string, bigint>>({});
  const [navPerShare, setNavPerShare] = useState<Record<string, bigint>>({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * The server render is the initial list, not the last word: each network has
   * its own registry, so switching one has to reread it here.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch is the refetch trigger a write bumps, not a value this effect reads
  useEffect(() => {
    let cancelled = false;

    fetchIndexes(chainId)
      .then((indexes) => {
        if (!cancelled) {
          setLiveIndexes(indexes);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [chainId, epoch]);

  /**
   * Flattened to a string so the effect depends on the vault list's contents
   * rather than the array identity a server render hands over fresh each time.
   */
  const vaultKey = liveIndexes
    .flatMap((entry) => (entry.vault ? [`${entry.label}:${entry.vault}`] : []))
    .join(",");

  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch is the refetch trigger a write bumps, not a value this effect reads
  useEffect(() => {
    if (!vaultKey) {
      setShares({});
      setNavPerShare({});
      return;
    }

    const client = getPublicClient(chainId);

    const vaults = vaultKey.split(",").map((entry) => {
      const [label, vault] = entry.split(":");
      return { label, vault: vault as `0x${string}` };
    });

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
    const nav = (vault: `0x${string}`) =>
      readOrFallback(
        `navPerShare(${vault})`,
        client.readContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "navPerShare",
        }),
        0n,
      );

    const balanceOf = (token: `0x${string}`, owner: `0x${string}`) =>
      readOrFallback(
        `balanceOf(${token})`,
        client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [owner],
        }),
        0n,
      );

    Promise.all([
      Promise.all(vaults.map((entry) => nav(entry.vault))),
      address
        ? Promise.all(vaults.map((entry) => balanceOf(entry.vault, address)))
        : Promise.resolve([] as bigint[]),
    ])
      .then(([navs, shareBalances]) => {
        if (cancelled) {
          return;
        }

        setNavPerShare(
          Object.fromEntries(
            vaults.map((entry, position) => [entry.label, navs[position]]),
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
  }, [address, chainId, epoch, vaultKey]);

  const value = useMemo<PortfolioContextValue>(() => {
    const positions = liveIndexes.flatMap((entry) => {
      const balance = shares[entry.label] ?? 0n;

      if (balance === 0n) {
        return [];
      }

      const notional =
        (balance * (navPerShare[entry.label] ?? 0n)) / SHARE_UNIT;

      return [
        {
          index: entry,
          units: toFloat(balance, SHARE_DECIMALS),
          valueUsd: toFloat(notional, UNIT_DECIMALS),
        } satisfies PortfolioPosition,
      ];
    });

    return {
      liveIndexes,
      shares,
      navPerShare,
      positions,
      totalValueUsd: positions.reduce(
        (total, position) => total + position.valueUsd,
        0,
      ),
      isLoading,
    };
  }, [isLoading, liveIndexes, navPerShare, shares]);

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextValue =>
  useContext(PortfolioContext);
