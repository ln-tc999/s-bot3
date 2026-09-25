"use client";

import { useCallback, useState } from "react";
import { erc20Abi, maxUint256 } from "viem";
import { getPublicClient } from "@/lib/chain/client";
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
  const {
    address,
    isBotChain,
    chainId,
    getWalletClient,
    refresh,
    switchNetwork,
  } = useWallet();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{
    label: string;
    hash: `0x${string}`;
  } | null>(null);

  /** Reads go to whichever BOT chain the wallet is on, not a build-time one. */
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
    [address, client, isBotChain, refresh, switchNetwork],
  );

  /**
   * Approves only what is short, so a repeat subscription is one signature
   * instead of one per constituent every time.
   */
  const ensureAllowance = useCallback(
    async (token: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
      if (amount === 0n) {
        return;
      }

      const owner = address as `0x${string}`;

      const allowance = await client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, spender],
      });

      if (allowance >= amount) {
        return;
      }

      const hash = await getWalletClient().writeContract({
        address: token,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, maxUint256],
      });
      await client.waitForTransactionReceipt({ hash });
    },
    [address, client, getWalletClient],
  );

  /**
   * Deliver the basket and mint shares.
   *
   * `maxAmounts` is quoted immediately before this runs and passed straight
   * through: the vault reads weights live, so an agent rebalancing in between
   * would otherwise pull a different basket than the one the user approved.
   */
  const subscribe = useCallback(
    (
      vault: `0x${string}`,
      shares: bigint,
      tokens: readonly `0x${string}`[],
      maxAmounts: readonly bigint[],
    ) =>
      send("subscribe", async () => {
        for (const [index, token] of tokens.entries()) {
          await ensureAllowance(token, vault, maxAmounts[index] ?? 0n);
        }

        return getWalletClient().writeContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "subscribe",
          args: [shares, [...maxAmounts]],
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
   * Fund a wallet with the constituents it is short of.
   *
   * Each `faucet()` mints one fixed claim, so a large subscription can need
   * several rounds — the caller decides how many by what it passes in. Only a
   * MockERC20 has one, so callers gate this on the network being a testnet.
   */
  const faucet = useCallback(
    (tokens: readonly `0x${string}`[]) =>
      send("faucet", async () => {
        const wallet = getWalletClient();
        let last: `0x${string}` | undefined;

        for (const token of tokens) {
          last = await wallet.writeContract({
            address: token,
            abi: mockErc20Abi,
            functionName: "faucet",
          });
          await client.waitForTransactionReceipt({ hash: last });
        }

        if (!last) {
          throw new Error("Nothing to claim.");
        }

        return last;
      }),
    [client, getWalletClient, send],
  );

  /** Clearing the result is what closes the success dialog. */
  const dismiss = useCallback(() => setLast(null), []);

  return { pending, error, last, dismiss, subscribe, redeem, faucet };
};
