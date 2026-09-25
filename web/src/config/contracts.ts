import { botMainnet, botTestnet } from "@/lib/chain/chains";

/**
 * Settlement is in kind, so there is no single quote token to configure — a
 * vault pulls whatever the TokenBook binds each of its constituents to.
 */

export interface NetworkInfo {
  chainId: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  registryAddress?: `0x${string}`;
  tokenBookAddress?: `0x${string}`;
  isTestnet: boolean;
  chain: typeof botTestnet | typeof botMainnet;
}

export const NETWORKS: Record<number, NetworkInfo> = {
  968: {
    chainId: 968,
    name: "BOT Chain Testnet",
    shortName: "Testnet 968",
    rpcUrl: "https://rpc.bohr.life",
    explorerUrl: "https://scan.bohr.life",
    /**
     * No hardcoded default any more. The address that used to sit here was the
     * registry deployed before settlement moved in kind, and `getIndex` kept the
     * same shape across that change — so an unconfigured build read indexes off
     * it happily and then showed a NAV of $0.00 and 0.00% drift, because
     * `navPerShare` and `driftBps` do not exist there and the fallback reads as
     * data. Undefined says "not deployed yet", which is the truth.
     */
    registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as
      | `0x${string}`
      | undefined,
    tokenBookAddress: process.env.NEXT_PUBLIC_TOKENBOOK_ADDRESS as
      | `0x${string}`
      | undefined,
    isTestnet: true,
    chain: botTestnet,
  },
  677: {
    chainId: 677,
    name: "BOT Chain Mainnet",
    shortName: "Mainnet 677",
    rpcUrl: "https://rpc.botchain.ai",
    explorerUrl: "https://scan.botchain.ai",
    registryAddress: process.env.NEXT_PUBLIC_MAINNET_REGISTRY_ADDRESS as
      | `0x${string}`
      | undefined,
    tokenBookAddress: process.env.NEXT_PUBLIC_MAINNET_TOKENBOOK_ADDRESS as
      | `0x${string}`
      | undefined,
    isTestnet: false,
    chain: botMainnet,
  },
};

export const DEFAULT_CHAIN_ID = 968;

export const getNetworkConfig = (chainId?: number | null): NetworkInfo => {
  if (chainId && NETWORKS[chainId]) {
    return NETWORKS[chainId];
  }
  return NETWORKS[DEFAULT_CHAIN_ID];
};
