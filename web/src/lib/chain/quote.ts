import { getNetworkConfig } from "@/config/contracts";

/**
 * Settlement is single asset.
 */
export const QUOTE = {
  symbol: "musdc",
  /** What the interface calls it. The `m` for mock is what the network already says. */
  ticker: "USDC",
  name: "Mock USD",
  decimals: 6,
} as const;

/**
 * There is no price feed on BOT Chain worth trusting, so valuations are a fixed
 * mark. Balances are real and read from the chain; only this number is stated.
 */
export const QUOTE_PRICE_USD = 1;

export const quoteAddress = (chainId?: number | null): `0x${string}` | undefined =>
  getNetworkConfig(chainId).quoteAddress;
