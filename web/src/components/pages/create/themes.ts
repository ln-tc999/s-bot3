import type { TokenSymbol } from "@/types/index-fund";

interface Theme {
  id: string;
  keywords: string[];
  symbols: TokenSymbol[];
}

/**
 * What an index says it tracks decides what it holds. Ordered by specificity:
 * "staked ether" has to beat plain "ether", so the narrower themes come first
 * and win ties.
 */
const THEMES: Theme[] = [
  {
    id: "stables",
    keywords: ["stablecoin", "stable", "dollar", "usd", "treasury", "parity"],
    symbols: ["usdc", "usdt", "dai"],
  },
  {
    id: "staking",
    keywords: ["staked", "staking", "validator", "consensus", "lsd", "lido"],
    symbols: ["ldo", "rpl", "fxs"],
  },
  {
    id: "rollups",
    keywords: [
      "rollup",
      "layer 2",
      "l2",
      "arbitrum",
      "optimism",
      "polygon",
      "settle back",
    ],
    symbols: ["arb", "op", "matic"],
  },
  {
    id: "ai",
    keywords: [
      "ai",
      "agentic",
      "compute",
      "inference",
      "render",
      "agent",
      "gpu",
      "machine learning",
    ],
    symbols: ["rndr", "fet", "inj"],
  },
  {
    id: "oracles",
    keywords: [
      "oracle",
      "price feed",
      "feeds",
      "data",
      "interoperability",
      "settlement",
      "chainlink",
    ],
    symbols: ["link", "snx", "comp"],
  },
  {
    id: "lending",
    keywords: [
      "lending",
      "lend",
      "borrow",
      "money market",
      "governance",
      "defi",
      "credit",
    ],
    symbols: ["aave", "comp", "mkr", "uni"],
  },
  {
    id: "modular",
    keywords: [
      "modular",
      "data availability",
      "execution layer",
      "celestia",
      "app chain",
    ],
    symbols: ["tia", "sui", "apt", "near", "atom"],
  },
  {
    id: "alt-l1",
    keywords: [
      "alternative layer 1",
      "alt l1",
      "layer 1",
      "throughput",
      "solana",
      "avalanche",
      "cardano",
    ],
    symbols: ["sol", "avax", "dot", "ada"],
  },
  {
    id: "ether",
    keywords: ["ether", "wrapped ether"],
    symbols: ["weth", "ldo"],
  },
  {
    id: "bitcoin",
    keywords: ["bitcoin", "btc", "wrapped bitcoin", "digital gold"],
    symbols: ["wbtc", "btc"],
  },
  {
    id: "majors",
    keywords: [
      "major",
      "blue chip",
      "large cap",
      "core",
      "largest",
      "market cap",
    ],
    symbols: ["btc", "eth", "sol"],
  },
];

const SHORT_KEYWORD = 3;

/**
 * Longer keywords match as a prefix, so "rollup" catches "rollups" and "stable"
 * catches "stablecoins". Short ones have to be whole words: a bare `eth`
 * matches inside "Ethereum", which made every rollup index look like an ether
 * index.
 */
const toPattern = (keyword: string): RegExp =>
  new RegExp(
    keyword.length <= SHORT_KEYWORD ? `\\b${keyword}\\b` : `\\b${keyword}`,
    "i",
  );

/**
 * The constituents an index's own words imply, or null when the words say
 * nothing recognisable — in which case whatever is already selected stands.
 */
export const matchTheme = (text: string): TokenSymbol[] | null => {
  let best: Theme | null = null;
  let bestScore = 0;

  for (const theme of THEMES) {
    const score = theme.keywords.filter((keyword) =>
      toPattern(keyword).test(text),
    ).length;

    if (score > bestScore) {
      best = theme;
      bestScore = score;
    }
  }

  return best?.symbols ?? null;
};

export const isSameSelection = (
  first: readonly TokenSymbol[],
  second: readonly TokenSymbol[],
): boolean =>
  first.length === second.length &&
  first.every((symbol, index) => symbol === second[index]);
