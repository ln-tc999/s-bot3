import { formatUnits } from "viem";
import { getPublicClient, readOrFallback } from "./client";
import type { LiveIndex } from "./registry";
import { UNIT_DECIMALS } from "./unit";
import { indexVaultAbi } from "./vault";

export interface LiquidityStat {
  /** Every attached vault's basket, at the unit prices it was deployed with. */
  totalUsd: number;
  vaultCount: number;
}

/**
 * What the live vaults hold in total, as each one values its own basket.
 *
 * `totalNotional` rather than supply times NAV: they are equal by construction,
 * and this is one read instead of two. Read on the server so the explore tiles
 * do not need a wallet or a client round trip.
 */
export const sumLiquidity = async (
  indexes: LiveIndex[],
  chainId?: number | null,
): Promise<LiquidityStat> => {
  const client = getPublicClient(chainId);
  const vaults = indexes.flatMap((entry) => (entry.vault ? [entry.vault] : []));

  if (vaults.length === 0) {
    return { totalUsd: 0, vaultCount: 0 };
  }

  const holdings = await Promise.all(
    vaults.map((vault) =>
      readOrFallback(
        `totalNotional(${vault})`,
        client.readContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "totalNotional",
        }),
        0n,
      ),
    ),
  );

  const total = holdings.reduce((sum, held) => sum + held, 0n);

  return {
    totalUsd: Number(formatUnits(total, UNIT_DECIMALS)),
    vaultCount: vaults.length,
  };
};
