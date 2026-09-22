import { formatUnits } from "viem";
import { publicClient, readOrFallback } from "./client";
import { UNIT_DECIMALS } from "./unit";
import { indexVaultAbi } from "./vault";

/**
 * What a vault says about itself. Every field is one read from the contract that
 * will actually settle the trade, so a preview and a receipt cannot disagree.
 *
 * bigints are kept as bigints here and converted at the edge. This crosses the
 * server to client boundary in places, and a bigint does not survive that — so
 * anything handed to a client component goes through `toVaultSummary` first.
 */
export interface VaultState {
  address: `0x${string}`;
  navPerShare: bigint;
  totalSupply: bigint;
  feeBps: number;
  /** The slice of `feeBps` paid out rather than left to holders. */
  ownerFeeBps: number;
  feeRecipient: `0x${string}`;
  driftBps: number;
  tokens: `0x${string}`[];
  unitPrices: bigint[];
  holdings: bigint[];
}

/** The serialisable shape, for passing through a server component. */
export interface VaultSummary {
  address: `0x${string}`;
  /** Units of account per whole share, as a float for display only. */
  navPerShare: number;
  /**
   * The same number unrounded, as a decimal string.
   *
   * A bigint does not survive the server to client boundary, and a client
   * component that waits for its own read to land paints a $0.00 first. This is
   * what it starts from instead.
   */
  navWei: string;
  feeBps: number;
  ownerFeeBps: number;
  driftBps: number;
  /** True once anyone holds a share, which is when drift starts meaning anything. */
  hasSupply: boolean;
}

export const fetchVaultState = async (
  vault: `0x${string}`,
): Promise<VaultState | null> => {
  const read = <T>(functionName: string, fallback: T) =>
    readOrFallback(
      `${functionName}(${vault})`,
      publicClient.readContract({
        address: vault,
        abi: indexVaultAbi,
        // biome-ignore lint/suspicious/noExplicitAny: one helper for reads with different return types
        functionName: functionName as any,
      }) as Promise<T>,
      fallback,
    );

  try {
    const [
      navPerShare,
      totalSupply,
      feeBps,
      ownerFeeBps,
      feeRecipient,
      driftBps,
      tokens,
      unitPrices,
      holdings,
    ] = await Promise.all([
      read<bigint>("navPerShare", 0n),
      read<bigint>("totalSupply", 0n),
      read<number>("feeBps", 0),
      read<number>("ownerFeeBps", 0),
      read<`0x${string}`>(
        "feeRecipient",
        "0x0000000000000000000000000000000000000000",
      ),
      read<bigint>("driftBps", 0n),
      read<readonly `0x${string}`[]>("tokens", []),
      read<readonly bigint[]>("unitPrices", []),
      read<readonly bigint[]>("holdings", []),
    ]);

    return {
      address: vault,
      navPerShare,
      totalSupply,
      feeBps: Number(feeBps),
      ownerFeeBps: Number(ownerFeeBps),
      feeRecipient,
      driftBps: Number(driftBps),
      tokens: [...tokens],
      unitPrices: [...unitPrices],
      holdings: [...holdings],
    };
  } catch (cause) {
    console.warn(`[s-bot3] reading vault ${vault} failed:`, cause);
    return null;
  }
};

export const toVaultSummary = (state: VaultState): VaultSummary => ({
  address: state.address,
  navPerShare: Number(formatUnits(state.navPerShare, UNIT_DECIMALS)),
  navWei: state.navPerShare.toString(),
  feeBps: state.feeBps,
  ownerFeeBps: state.ownerFeeBps,
  driftBps: state.driftBps,
  hasSupply: state.totalSupply > 0n,
});

export const fetchVaultSummary = async (
  vault: `0x${string}`,
): Promise<VaultSummary | null> => {
  const state = await fetchVaultState(vault);
  return state ? toVaultSummary(state) : null;
};
