import { createPublicClient, http, type PublicClient } from "viem";
import { getChain } from "./chains";

const clients = new Map<number, PublicClient>();

export const getPublicClient = (chainId?: number | null): PublicClient => {
  const chain = getChain(chainId);
  if (!clients.has(chain.id)) {
    const client = createPublicClient({
      chain,
      transport: http(
        chain.id === 677
          ? "https://rpc.botchain.ai"
          : "https://rpc.bohr.life"
      ),
    }) as PublicClient;
    clients.set(chain.id, client);
  }
  return clients.get(chain.id)!;
};

/** Default read client. */
export const publicClient = getPublicClient();

/**
 * A read that degrades to a fallback instead of taking the page down, without
 * losing the reason.
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
