import { defineChain } from "viem";

/**
 * BOT Chain is EVM-compatible, so these are plain viem chains — nothing about
 * the app needs to know it is not Ethereum beyond these two definitions.
 */
export const botTestnet = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.bohr.life"] } },
  blockExplorers: {
    default: { name: "BOTScan Testnet", url: "https://scan.bohr.life" },
  },
  testnet: true,
});

export const botMainnet = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.botchain.ai"] } },
  blockExplorers: {
    default: { name: "BOTScan", url: "https://scan.botchain.ai" },
  },
});

export const CHAINS = { 968: botTestnet, 677: botMainnet } as const;

export type BotChainId = keyof typeof CHAINS;

export const isBotChainId = (id: number | null | undefined): id is BotChainId =>
  id != null && id in CHAINS;

export const getChain = (chainId?: number | null) => {
  if (chainId && isBotChainId(chainId)) {
    return CHAINS[chainId];
  }
  const raw = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 968);
  return isBotChainId(raw) ? CHAINS[raw] : botTestnet;
};

/**
 * Active chain fallback
 */
export const activeChain = getChain();

export const explorerTx = (hash: string, chainId?: number | null): string => {
  const chain = getChain(chainId);
  return `${chain.blockExplorers.default.url}/tx/${hash}`;
};

export const explorerAddress = (
  address: string,
  chainId?: number | null,
): string => {
  const chain = getChain(chainId);
  return `${chain.blockExplorers.default.url}/address/${address}`;
};
