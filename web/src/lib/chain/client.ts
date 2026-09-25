import { createPublicClient, http, type PublicClient } from "viem";
import { getChain } from "./chains";

const clients = new Map<number, PublicClient>();

export const getPublicClient = (chainId?: number | null): PublicClient => {
  const chain = getChain(chainId);
  const cached = clients.get(chain.id);

  if (!cached) {
    /**
     * `NEXT_PUBLIC_RPC_URL` is scoped to the chain it was configured next to, so
     * pointing a local run at anvil does not also redirect the other network to
     * it when the switcher flips. Unset, every chain uses its own node from
     * `chains.ts` rather than a URL repeated here.
     */
    const override = process.env.NEXT_PUBLIC_RPC_URL;
    const isConfiguredChain = chain.id === getChain().id;

    const client = createPublicClient({
      chain,
      transport: http(
        override && isConfiguredChain
          ? override
          : chain.rpcUrls.default.http[0],
      ),
    }) as PublicClient;
    clients.set(chain.id, client);
    return client;
  }

  return cached;
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
