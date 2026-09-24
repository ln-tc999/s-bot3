import { botMainnet, botTestnet } from "@/lib/chain/chains";

export interface NetworkInfo {
  chainId: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  registryAddress?: `0x${string}`;
  quoteAddress?: `0x${string}`;
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
    registryAddress: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ||
      "0x1955eF9145cCAa643a8Ee61aE3206F0acb632Adf") as `0x${string}`,
    quoteAddress: (process.env.NEXT_PUBLIC_QUOTE_ADDRESS ||
      "0x75ef70Ea33994a16751ff0b4f7DCF0F94DF1351F") as `0x${string}`,
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
    quoteAddress: process.env.NEXT_PUBLIC_MAINNET_QUOTE_ADDRESS as
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
