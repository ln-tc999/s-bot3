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

/**
 * The network a visitor gets when neither a cookie nor a wallet has said.
 *
 * `NEXT_PUBLIC_CHAIN_ID` wins when it is set to a chain we know. Otherwise
 * prefer mainnet once mainnet is configured: the switcher hides a network
 * whose registry address is missing, so defaulting to one is a page that can
 * only say "not deployed yet". Testnet is the last resort — it is the network
 * that works with nothing but its own addresses.
 */
const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

export const DEFAULT_CHAIN_ID: BotChainId = isBotChainId(envChainId)
  ? envChainId
  : process.env.NEXT_PUBLIC_MAINNET_REGISTRY_ADDRESS
    ? (botMainnet.id as BotChainId)
    : (botTestnet.id as BotChainId);

export const getChain = (chainId?: number | null) => {
  if (chainId && isBotChainId(chainId)) {
    return CHAINS[chainId];
  }
  return CHAINS[DEFAULT_CHAIN_ID];
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
