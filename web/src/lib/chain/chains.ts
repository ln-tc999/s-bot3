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

const CHAINS = { 968: botTestnet, 677: botMainnet } as const;

export type BotChainId = keyof typeof CHAINS;

const isBotChainId = (id: number): id is BotChainId => id in CHAINS;

/**
 * Which chain this deployment talks to. Set `NEXT_PUBLIC_CHAIN_ID=677` on the
 * production host and leave it unset locally. Inlined by Next at build time, so
 * it cannot be changed without a rebuild — which is the point: the deployed
 * site should never be ambiguous about the chain it settles on.
 */
export const activeChain = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 968);
  return isBotChainId(raw) ? CHAINS[raw] : botTestnet;
})();

export const explorerTx = (hash: string): string =>
  `${activeChain.blockExplorers.default.url}/tx/${hash}`;

export const explorerAddress = (address: string): string =>
  `${activeChain.blockExplorers.default.url}/address/${address}`;
