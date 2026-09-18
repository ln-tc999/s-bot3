import { createPublicClient, http } from "viem";
import { activeChain } from "./chains";

/** Read client. Server and browser share it; no wallet involved. */
export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

/**
 * A read that degrades to a fallback instead of taking the page down, without
 * losing the reason.
 *
 * The silent version of this cost us once already: `multicall` throws outright
 * on a chain with no Multicall3, and a bare `.catch(() => 0n)` turned that into
 * every balance quietly reading zero, with nothing in the console to chase.
 */
export const readOrFallback = async <T>(
  label: string,
  call: Promise<T>,
  fallback: T,
): Promise<T> => {
  try {
    return await call;
  } catch (cause) {
    console.warn(`[s-bot3] ${label} failed, using fallback:`, cause);
    return fallback;
  }
};
