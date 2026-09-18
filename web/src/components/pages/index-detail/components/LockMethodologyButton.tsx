"use client";

import { LockSimpleIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { sbot3RegistryAbi } from "@/lib/chain/abi";
import { publicClient } from "@/lib/chain/client";
import { registryAddress } from "@/lib/chain/registry";
import { useWallet } from "@/lib/onchain/WalletProvider";

interface LockMethodologyButtonProps {
  label: string;
  owner: `0x${string}`;
}

/**
 * Freezes the methodology. There is no unlock function on the registry and no
 * admin who could add one, so this is the rare button whose warning is literal.
 */
export const LockMethodologyButton = ({
  label,
  owner,
}: LockMethodologyButtonProps) => {
  const { address, isBotChain, getWalletClient, refresh, switchNetwork } =
    useWallet();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = address?.toLowerCase() === owner.toLowerCase();

  if (!isOwner) {
    return <span className="text-xs text-ink-muted">Editable</span>;
  }

  const lock = async () => {
    const registry = registryAddress();

    if (!registry) {
      setError("The registry is not configured for this deployment.");
      return;
    }

    if (!isBotChain) {
      await switchNetwork();
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const hash = await getWalletClient().writeContract({
        address: registry,
        abi: sbot3RegistryAbi,
        functionName: "lock",
        args: [label],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setIsConfirming(false);
      refresh();
      /** The panel reads its lock state on the server, so the page has to refetch. */
      globalThis.location.reload();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message.split("\n")[0] : "Lock failed",
      );
    } finally {
      setIsPending(false);
    }
  };

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90"
      >
        <LockSimpleIcon size={12} weight="fill" aria-hidden />
        Lock it
      </button>
    );
  }

  return (
    <span className="flex flex-col items-end gap-1.5">
      <span className="flex items-center gap-1.5 text-xs text-negative">
        <WarningIcon size={12} weight="fill" aria-hidden />
        Cannot be undone
      </span>
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
          className="rounded-full px-2 py-1 text-xs text-ink-muted transition-colors duration-150 ease-out hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={lock}
          disabled={isPending}
          className="rounded-full bg-negative px-2.5 py-1 text-xs font-semibold text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Locking…" : "Lock forever"}
        </button>
      </span>
      {error ? (
        <span className="text-[11px] text-negative">{error}</span>
      ) : null}
    </span>
  );
};
