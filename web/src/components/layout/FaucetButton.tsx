"use client";

import { DropIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import {
  fetchRegisteredSymbols,
  fetchTokenAddresses,
  tokenBookAddress,
} from "@/lib/chain/tokenbook";
import { useNetwork } from "@/lib/chain/use-network";
import { cn } from "@/lib/cn";
import { useVaultActions } from "@/lib/onchain/useVaultActions";
import { useWallet } from "@/lib/onchain/WalletProvider";

/**
 * Claims every constituent the book knows about, in one go.
 *
 * The per-basket faucet on a trade page can only appear once an index has a
 * vault and a quantity has been typed — which left a visitor with no way to hold
 * anything at all before that, and no way to find out why. This asks the book
 * rather than an index, so it works on an empty registry.
 *
 * Testnet only: `faucet()` is a MockERC20 affordance, and on mainnet the book
 * binds real tokens that have no such function.
 */
export const FaucetButton = () => {
  const { address, chainId } = useWallet();
  const actions = useVaultActions();
  const [tokens, setTokens] = useState<`0x${string}`[]>([]);
  /** Distinct from "none bound": a read in flight must not be reported as empty. */
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * The network on show, not the build's: `activeChain` is fixed at build
   * time, so a testnet build kept offering a faucet after the wallet moved to
   * mainnet — where `faucet()` either reverts or mints something that should
   * not be mintable. On mainnet the button is not rendered at all.
   */
  const network = useNetwork();
  const book = tokenBookAddress(network.chainId);

  useEffect(() => {
    if (!book || !network.isTestnet) {
      return;
    }

    let cancelled = false;

    fetchRegisteredSymbols(network.chainId)
      .then((symbols) =>
        symbols.length > 0
          ? fetchTokenAddresses(symbols, network.chainId)
          : null,
      )
      .then((addresses) => {
        if (!cancelled) {
          setTokens(addresses ?? []);
          setIsLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [book, network]);

  if (!network.isTestnet) {
    return null;
  }

  const blocked = (() => {
    if (!book) return "No TokenBook is configured yet";
    if (!isLoaded) return "Reading the token book…";
    if (tokens.length === 0) return "No constituents are bound yet";
    if (!address) return "Connect a wallet first";
    if (chainId !== network.chainId) return `Switch to ${network.name}`;
    return null;
  })();

  const isPending = actions.pending === "faucet";

  return (
    <button
      type="button"
      onClick={() => actions.faucet(tokens)}
      disabled={blocked !== null || isPending}
      title={
        blocked ??
        `Claim all ${tokens.length} test tokens — ${tokens.length} signatures`
      }
      className={cn(
        "flex size-11 items-center justify-center rounded-2xl transition-all duration-150 ease-out",
        blocked
          ? "cursor-not-allowed text-ink-subtle opacity-40"
          : "text-accent-ink hover:bg-accent-soft hover:text-accent",
      )}
    >
      <DropIcon size={20} weight={isPending ? "fill" : "regular"} aria-hidden />
      <span className="sr-only">Get test tokens</span>
    </button>
  );
};
