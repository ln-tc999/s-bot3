/**
 * Settlement is single asset. An earlier iteration let a deposit be paid in any
 * of four tokens because four were deployed; here there is one mock dollar and
 * every vault settles in it, so the whole quote-selection surface collapses
 * into this file.
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

export const quoteAddress = (): `0x${string}` | undefined =>
  process.env.NEXT_PUBLIC_QUOTE_ADDRESS as `0x${string}` | undefined;
