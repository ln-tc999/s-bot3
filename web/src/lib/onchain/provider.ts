import { activeChain } from "@/lib/chain/chains";

export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (payload: never) => void) => void;
  removeListener?: (event: string, handler: (payload: never) => void) => void;
}

/** The subset of EIP-6963's announced info this app shows or keys on. */
export interface WalletInfo {
  uuid: string;
  name: string;
  icon: string;
  /** Reverse-DNS id, stable across sessions — what the remembered choice keys on. */
  rdns: string;
}

export interface WalletDetail {
  info: WalletInfo;
  provider: Eip1193Provider;
}

export const CHAIN_ID = activeChain.id;

/**
 * The legacy injected wallet, or undefined.
 *
 * Kept as a fallback, not as the main path: `window.ethereum` holds whichever
 * extension won the race to inject, so on a machine with two wallets installed
 * it is a coin toss which one answers. EIP-6963 below is how each wallet
 * announces itself separately.
 */
export const getInjectedProvider = (): Eip1193Provider | undefined =>
  (globalThis as { ethereum?: Eip1193Provider }).ethereum;

const ANNOUNCE = "eip6963:announceProvider";
const REQUEST = "eip6963:requestProvider";

/**
 * Asks every installed wallet to announce itself, and keeps listening: wallets
 * may answer late, and an extension enabled after page load announces without
 * being asked again. Returns the unsubscribe.
 */
export const discoverWallets = (
  onAnnounce: (detail: WalletDetail) => void,
): (() => void) => {
  if (typeof globalThis.addEventListener !== "function") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<WalletDetail>).detail;
    if (detail?.info?.rdns && detail.provider) {
      onAnnounce(detail);
    }
  };

  globalThis.addEventListener(ANNOUNCE, handler);
  globalThis.dispatchEvent(new Event(REQUEST));

  return () => globalThis.removeEventListener(ANNOUNCE, handler);
};

const toHexChainId = (id: number): `0x${string}` => `0x${id.toString(16)}`;

/** The wallet does not know this chain yet. */
const CHAIN_NOT_ADDED = 4902;

/**
 * Move the wallet to BOT Chain, adding the network if it has never seen it.
 *
 * Nobody arrives with BOT Chain already configured, so the add path is the
 * normal path, not the edge case — a visitor who has to leave and configure a
 * network by hand is a visitor who never comes back. MetaMask reports the
 * unknown chain as 4902, but some wallets bury the same condition inside
 * -32603, so both are treated as "offer to add it".
 */
export const requestBotChain = async (provider: Eip1193Provider) => {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(CHAIN_ID) }],
    });
  } catch (error) {
    const code = (error as { code?: number }).code;

    if (code !== CHAIN_NOT_ADDED && code !== -32603) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: toHexChainId(CHAIN_ID),
          chainName: activeChain.name,
          nativeCurrency: activeChain.nativeCurrency,
          rpcUrls: [activeChain.rpcUrls.default.http[0]],
          blockExplorerUrls: [activeChain.blockExplorers.default.url],
        },
      ],
    });
  }
};
