/**
 * The unit of account.
 *
 * A weight is a share of value, so turning one into a quantity of tokens needs
 * a price. There is no feed on BOT Chain worth trusting, so each vault carries
 * its own price vector, declared once at deployment and immutable after — it
 * converts weights into quantities and nothing else. It is not a claim about
 * what anything trades for.
 *
 * Everything is 18 decimals: shares, prices and notional alike. The old build
 * mixed 6 and 18 and the mismatch was one wrong constant away from mispricing
 * every deposit by a factor of a thousand.
 */
export const UNIT_DECIMALS = 18;

export const UNIT = {
  decimals: UNIT_DECIMALS,
  /** What the interface calls a unit when it prints one. */
  ticker: "USD",
} as const;

/** What a share is worth before anyone has subscribed, offered by the deploy form. */
export const DEFAULT_SEED_NAV = "100";

/**
 * What the deploy form offers, not what the contract requires. An index owner
 * sets both: `feeBps` is charged on subscribe and redeem, and `ownerFeeBps` is
 * the slice of it paid out instead of left to holders. Zero means the whole fee
 * stays in the basket.
 */
export const DEFAULT_FEE_BPS = 20;
export const DEFAULT_OWNER_FEE_BPS = 0;

/** `IndexVault.MAX_FEE_BPS` — 1%, so the form can refuse before the chain does. */
export const MAX_FEE_BPS = 100;
