import { formatUnits } from "viem";
import { getPublicClient, readOrFallback } from "./client";
import { QUOTE, QUOTE_PRICE_USD } from "./quote";
import type { LiveIndex } from "./registry";
import { indexVaultAbi, SHARE_DECIMALS } from "./vault";

const SHARE_UNIT = 10n ** BigInt(SHARE_DECIMALS);

export interface LiquidityStat {
  /** Every attached vault's holdings, marked at the fixed quote price. */
  totalUsd: number;
  vaultCount: number;
}

/**
 * What the live vaults hold in total: shares outstanding times share price,
 * which the vault itself states as quote units per whole share. Read on the
 * server so the explore tiles do not need a wallet or a client round trip.
 */
export const sumLiquidity = async (
  indexes: LiveIndex[],
  chainId?: number | null,
): Promise<LiquidityStat> => {
  const client = getPublicClient(chainId);
  const vaults = indexes.flatMap((entry) =>
    entry.vault ? [entry.vault] : [],
  );

  if (vaults.length === 0) {
    return { totalUsd: 0, vaultCount: 0 };
  }

  const holdings = await Promise.all(
    vaults.map(async (vault) => {
      const [supply, price] = await Promise.all([
        readOrFallback(
          `totalSupply(${vault})`,
          client.readContract({
            address: vault,
            abi: indexVaultAbi,
            functionName: "totalSupply",
          }),
          0n,
        ),
        readOrFallback(
          `sharePrice(${vault})`,
          client.readContract({
            address: vault,
            abi: indexVaultAbi,
            functionName: "sharePrice",
          }),
          0n,
        ),
      ]);

      return (supply * price) / SHARE_UNIT;
    }),
  );

  const totalQuote = holdings.reduce((total, held) => total + held, 0n);

  return {
    totalUsd: Number(formatUnits(totalQuote, QUOTE.decimals)) * QUOTE_PRICE_USD,
    vaultCount: vaults.length,
  };
};
