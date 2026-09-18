export const TOKEN_SYMBOLS = [
  "btc",
  "eth",
  "weth",
  "wbtc",
  "sol",
  "xrp",
  "doge",
  "uni",
  "aave",
  "mkr",
  "ldo",
  "crv",
  "link",
  "comp",
  "snx",
  "arb",
  "op",
  "matic",
  "usdc",
  "usdt",
  "dai",
  "avax",
  "dot",
  "ada",
  "rpl",
  "fxs",
  "rndr",
  "fet",
  "inj",
  "tia",
  "sui",
  "apt",
  "near",
  "atom",
] as const;

export type TokenSymbol = (typeof TOKEN_SYMBOLS)[number];

/**
 * Display metadata for a symbol. There is no address here: an index publishes
 * a symbol and a weight, and nothing else. Inventing a token contract for the
 * symbol would be this app asserting something the record does not say.
 */
export interface Token {
  symbol: TokenSymbol | string;
  name: string;
  decimals: number;
}

export interface Constituent {
  token: Token;
  weightBps: number;
}

export const SWAP_MODES = ["deposit", "swap", "redeem"] as const;

export type SwapMode = (typeof SWAP_MODES)[number];
