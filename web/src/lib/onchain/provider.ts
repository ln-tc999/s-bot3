import { getChain, isBotChainId } from "@/lib/chain/chains";

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

/** Legacy default */
export const CHAIN_ID = 968;

/**
 * The legacy injected wallet, or undefined.
 */
export const getInjectedProvider = (): Eip1193Provider | undefined =>
  (globalThis as { ethereum?: Eip1193Provider }).ethereum;

const ANNOUNCE = "eip6963:announceProvider";
const REQUEST = "eip6963:requestProvider";

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
 * Move the wallet to BOT Chain (Testnet 968 or Mainnet 677).
 */
export const requestBotChain = async (
  provider: Eip1193Provider,
  targetChainId: number = 968,
) => {
  const chain = getChain(targetChainId);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(chain.id) }],
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
          chainId: toHexChainId(chain.id),
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [chain.rpcUrls.default.http[0]],
          blockExplorerUrls: [chain.blockExplorers.default.url],
        },
      ],
    });
  }
};
