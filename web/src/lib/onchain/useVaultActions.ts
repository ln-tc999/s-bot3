"use client";

import { useCallback, useState } from "react";
import { erc20Abi, maxUint256 } from "viem";
import { getPublicClient } from "@/lib/chain/client";
import { quoteAddress } from "@/lib/chain/quote";
import { indexVaultAbi, mockErc20Abi } from "@/lib/chain/vault";
import { useWallet } from "./WalletProvider";

const toMessage = (error: unknown): string => {
  if (error instanceof Error) {
    /** Wallet rejections arrive with a whole stack appended. Keep the first line. */
    return error.message.split("\n")[0];
  }
  return "Transaction failed";
};

export const useVaultActions = () => {
  const { address, isBotChain, chainId, getWalletClient, refresh, switchNetwork } =
    useWallet();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{
    label: string;
    hash: `0x${string}`;
  } | null>(null);

  const client = getPublicClient(chainId);

  const send = useCallback(
    async (label: string, action: () => Promise<`0x${string}`>) => {
      if (!address) {
        setError("Connect a wallet first.");
        return null;
      }

      if (!isBotChain) {
        await switchNetwork();
        return null;
      }

      setPending(label);
      setError(null);

      try {
        const hash = await action();
        await client.waitForTransactionReceipt({ hash });
        setLast({ label, hash });
        refresh();
        return hash;
      } catch (cause) {
        setError(toMessage(cause));
        return null;
      } finally {
        setPending(null);
      }
    },
    [address, isBotChain, refresh, switchNetwork, client],
  );

  /** Approves only when the existing allowance is short, so repeat deposits are one transaction. */
  const ensureAllowance = useCallback(
    async (spender: `0x${string}`, amount: bigint) => {
      const quote = quoteAddress(chainId);
      const owner = address as `0x${string}`;

      if (!quote) {
        throw new Error(
          "No settlement token is configured for this deployment.",
        );
      }

      const allowance = await client.readContract({
        address: quote,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, spender],
      });

      if (allowance >= amount) {
        return;
      }

      const walletClient = getWalletClient();
      const hash = await walletClient.writeContract({
        address: quote,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, maxUint256],
      });
      await client.waitForTransactionReceipt({ hash });
    },
    [address, chainId, getWalletClient, client],
  );

  const deposit = useCallback(
    (vault: `0x${string}`, quoteAmount: bigint) =>
      send("deposit", async () => {
        await ensureAllowance(vault, quoteAmount);
        return getWalletClient().writeContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "deposit",
          args: [quoteAmount],
        });
      }),
    [ensureAllowance, getWalletClient, send],
  );

  const redeem = useCallback(
    (vault: `0x${string}`, shares: bigint) =>
      send("redeem", () =>
        getWalletClient().writeContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "redeem",
          args: [shares],
        }),
      ),
    [getWalletClient, send],
  );

  /**
   * There is no index to index route onchain, and inventing one would mean a
   * router holding both vaults' quote. Redeeming and redepositing is the same
   * trade with the same result, just visibly two signatures.
   */
  const swap = useCallback(
    (from: `0x${string}`, to: `0x${string}`, shares: bigint) =>
      send("swap", async () => {
        const quoteAmount = await client.readContract({
          address: from,
          abi: indexVaultAbi,
          functionName: "previewRedeem",
          args: [shares],
        });

        const walletClient = getWalletClient();
        const redeemHash = await walletClient.writeContract({
          address: from,
          abi: indexVaultAbi,
          functionName: "redeem",
          args: [shares],
        });
        await client.waitForTransactionReceipt({ hash: redeemHash });

        await ensureAllowance(to, quoteAmount);

        return walletClient.writeContract({
          address: to,
          abi: indexVaultAbi,
          functionName: "deposit",
          args: [quoteAmount],
        });
      }),
    [ensureAllowance, getWalletClient, send, client],
  );

  const faucet = useCallback(
    (token: `0x${string}`) =>
      send("faucet", () =>
        getWalletClient().writeContract({
          address: token,
          abi: mockErc20Abi,
          functionName: "faucet",
        }),
      ),
    [getWalletClient, send],
  );

  /** Clearing the result is what closes the success dialog. */
  const dismiss = useCallback(() => setLast(null), []);

  return { pending, error, last, dismiss, deposit, redeem, swap, faucet };
};
