"use client";

import { useCallback, useState } from "react";
import { sbot3RegistryAbi } from "@/lib/chain/abi";
import { publicClient } from "@/lib/chain/client";
import { registryAddress } from "@/lib/chain/registry";
import type { TokenSymbol } from "@/types/index-fund";
import { useWallet } from "./WalletProvider";

export interface CreateIndexInput {
  label: string;
  name: string;
  methodology: string;
  symbols: TokenSymbol[];
  weights: Record<string, number>;
}

export interface CreatedIndex {
  hash: `0x${string}`;
  label: string;
}

const toMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.split("\n")[0];
  }
  return "Publishing failed";
};

/**
 * Publication is one transaction against one contract. There is no approval
 * step and no allowlist, so the wallet that signs is the wallet that owns what
 * it just published.
 */
export const useCreateIndex = () => {
  const { address, isBotChain, getWalletClient, refresh, switchNetwork } =
    useWallet();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedIndex | null>(null);

  const publish = useCallback(
    async (input: CreateIndexInput) => {
      const registry = registryAddress();

      if (!registry) {
        setError("The registry is not configured for this deployment.");
        return;
      }

      if (!address) {
        setError("Connect a wallet first.");
        return;
      }

      if (!isBotChain) {
        await switchNetwork();
        return;
      }

      setIsPending(true);
      setError(null);

      try {
        /** Cheaper than letting `create` revert, and it can name the clash. */
        const taken = await publicClient.readContract({
          address: registry,
          abi: sbot3RegistryAbi,
          functionName: "exists",
          args: [input.label],
        });

        if (taken) {
          setError(
            `"${input.label}" is already published. Pick another label.`,
          );
          return;
        }

        const hash = await getWalletClient().writeContract({
          address: registry,
          abi: sbot3RegistryAbi,
          functionName: "create",
          args: [
            input.label,
            input.name,
            input.symbols,
            input.symbols.map((symbol) => input.weights[symbol] ?? 0),
            input.methodology,
          ],
        });

        await publicClient.waitForTransactionReceipt({ hash });
        setCreated({ hash, label: input.label });
        refresh();
      } catch (cause) {
        setError(toMessage(cause));
      } finally {
        setIsPending(false);
      }
    },
    [address, getWalletClient, isBotChain, refresh, switchNetwork],
  );

  return {
    publish,
    isPending,
    error,
    created,
    dismiss: useCallback(() => setCreated(null), []),
  };
};
