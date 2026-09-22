import { erc20Abi } from "viem";
import { tokenBookAbi } from "./abi";
import { publicClient, readOrFallback } from "./client";

/**
 * Where the symbol to token bindings live. The registry stores none, on purpose:
 * an index publishes a symbol and a weight, and an address would be the registry
 * asserting something the record does not say. Settlement needs one anyway, so
 * it is kept in its own write-once book.
 */
export const tokenBookAddress = (): `0x${string}` | undefined =>
  process.env.NEXT_PUBLIC_TOKENBOOK_ADDRESS as `0x${string}` | undefined;

/**
 * Resolve an index's symbols to the tokens it settles in.
 *
 * Returns null when any symbol is unbound, because a partial basket cannot be
 * subscribed to — better to say "not tradeable yet" than to render a form that
 * reverts on submit.
 */
export const fetchTokenAddresses = async (
  symbols: readonly string[],
): Promise<`0x${string}`[] | null> => {
  const book = tokenBookAddress();

  if (!book || symbols.length === 0) {
    return null;
  }

  try {
    const addresses = await publicClient.readContract({
      address: book,
      abi: tokenBookAbi,
      functionName: "addressesOf",
      args: [symbols as string[]],
    });

    return [...addresses];
  } catch {
    /** `addressesOf` reverts UnknownSymbol, which is "not bound", not a fault. */
    return null;
  }
};

export const fetchRegisteredSymbols = async (): Promise<string[]> => {
  const book = tokenBookAddress();

  if (!book) {
    return [];
  }

  const symbols = await readOrFallback(
    "allSymbols",
    publicClient.readContract({
      address: book,
      abi: tokenBookAbi,
      functionName: "allSymbols",
    }),
    [] as readonly string[],
  );

  return [...symbols];
};

export interface BasketToken {
  symbol: string;
  address: `0x${string}`;
  /** Read from the token itself — the scaling a weight is converted through. */
  decimals: number;
}

/**
 * The tokens an index settles in, ready to hand to a client component.
 *
 * Null means at least one constituent has no binding yet, which is what makes
 * an index untradeable rather than broken.
 */
export const fetchBasketTokens = async (
  symbols: readonly string[],
): Promise<BasketToken[] | null> => {
  const addresses = await fetchTokenAddresses(symbols);

  if (!addresses) {
    return null;
  }

  const decimals = await Promise.all(
    addresses.map((address) =>
      readOrFallback(
        `decimals(${address})`,
        publicClient.readContract({
          address,
          abi: erc20Abi,
          functionName: "decimals",
        }),
        18,
      ),
    ),
  );

  return symbols.map((symbol, index) => ({
    symbol,
    address: addresses[index],
    decimals: Number(decimals[index]),
  }));
};
