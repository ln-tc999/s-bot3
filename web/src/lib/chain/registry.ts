import { getNetworkConfig } from "@/config/contracts";
import { findToken } from "@/lib/tokens/registry";
import type { Constituent } from "@/types/index-fund";
import { sbot3RegistryAbi } from "./abi";
import { getPublicClient, readOrFallback } from "./client";

export const registryAddress = (chainId?: number | null): `0x${string}` | undefined =>
  getNetworkConfig(chainId).registryAddress;

const ZERO = "0x0000000000000000000000000000000000000000";

/**
 * An index exactly as the contract describes it. Nothing here is supplied by
 * this app: every field came out of one `getIndex` call.
 *
 * `createdAt` is a number rather than a bigint because this crosses the server
 * to client boundary, which a bigint does not survive.
 */
export interface LiveIndex {
  label: string;
  name: string;
  methodology: string;
  owner: `0x${string}`;
  /** The delegated rebalancer, or null when nobody is delegated. */
  agent: `0x${string}` | null;
  /** Irreversible. The methodology can never be rewritten once true. */
  isLocked: boolean;
  /** The share token this index settles in, or null before one is attached. */
  vault: `0x${string}` | null;
  createdAt: number;
  constituents: Constituent[];
}

/**
 * Weights come from the chain; names, icons and decimals are local display
 * metadata. A symbol with no local entry still renders, so an unrecognised
 * constituent is visible rather than silently dropped.
 */
const toConstituents = (
  symbols: readonly string[],
  weights: readonly number[],
): Constituent[] =>
  symbols.map((symbol, i) => {
    const token = findToken(symbol);
    return {
      token: {
        symbol: token?.symbol ?? symbol,
        name: token?.name ?? symbol.toUpperCase(),
        decimals: token?.decimals ?? 18,
      },
      weightBps: weights[i] ?? 0,
    } as Constituent;
  });

export const fetchIndex = async (label: string, chainId?: number | null): Promise<LiveIndex | null> => {
  const address = registryAddress(chainId);
  const client = getPublicClient(chainId);

  if (!address) {
    return null;
  }

  try {
    const [
      owner,
      agent,
      vault,
      locked,
      createdAt,
      name,
      methodology,
      symbols,
      weights,
    ] = await client.readContract({
      address,
      abi: sbot3RegistryAbi,
      functionName: "getIndex",
      args: [label],
    });

    return {
      label,
      name,
      methodology,
      owner,
      agent: agent === ZERO ? null : agent,
      isLocked: locked,
      vault: vault === ZERO ? null : vault,
      createdAt: Number(createdAt),
      constituents: toConstituents(symbols, weights),
    };
  } catch (cause) {
    /**
     * `getIndex` reverts UnknownIndex for a label nobody published, which is a
     * 404 and not a fault — so this one stays quiet unless the registry itself
     * is unreachable.
     */
    if (!String(cause).includes("UnknownIndex")) {
      console.warn(`[s-bot3] getIndex("${label}") failed:`, cause);
    }
    return null;
  }
};

/**
 * Every published index. `allLabels` means no event indexer and no block-range
 * scan — the contract keeps the list because listing is part of the product,
 * not an afterthought bolted on with logs.
 */
export const fetchIndexes = async (chainId?: number | null): Promise<LiveIndex[]> => {
  const address = registryAddress(chainId);
  const client = getPublicClient(chainId);

  if (!address) {
    return [];
  }

  const labels = await readOrFallback(
    "allLabels",
    client.readContract({
      address,
      abi: sbot3RegistryAbi,
      functionName: "allLabels",
    }),
    [] as readonly string[],
  );

  const indexes = await Promise.all(
    labels.map((label) => fetchIndex(label, chainId))
  );

  return indexes.filter((index): index is LiveIndex => index !== null);
};
