"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { sbot3RegistryAbi } from "@/lib/chain/abi";
import { publicClient } from "@/lib/chain/client";
import { registryAddress } from "@/lib/chain/registry";
import { useWallet } from "@/lib/onchain/WalletProvider";

interface DelegateAgentButtonProps {
  label: string;
  owner: `0x${string}`;
  /** Present when somebody is already delegated, which turns this into a revoke. */
  agent: `0x${string}` | null;
}

const ZERO = "0x0000000000000000000000000000000000000000";

/**
 * Hands the weight key to an agent, or takes it back. The agent can never do
 * more than this grants, so revoking leaves it with nothing — it does not need
 * to be trusted to behave after the fact.
 */
export const DelegateAgentButton = ({
  label,
  owner,
  agent,
}: DelegateAgentButtonProps) => {
  const { address, isBotChain, getWalletClient, switchNetwork } = useWallet();
  const [value, setValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (address?.toLowerCase() !== owner.toLowerCase()) {
    return null;
  }

  const submit = async (next: string) => {
    const registry = registryAddress();

    if (!registry) {
      setError("The registry is not configured for this deployment.");
      return;
    }

    if (!isBotChain) {
      await switchNetwork();
      return;
    }

    if (next !== ZERO && !isAddress(next)) {
      setError("That is not a valid address.");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const hash = await getWalletClient().writeContract({
        address: registry,
        abi: sbot3RegistryAbi,
        functionName: "delegate",
        args: [label, next as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      globalThis.location.reload();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message.split("\n")[0]
          : "Delegation failed",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-hairline px-5 py-4">
      {agent ? (
        <button
          type="button"
          onClick={() => submit(ZERO)}
          disabled={isPending}
          className="rounded-full bg-surface-subtle px-3 py-1.5 text-xs font-medium text-ink transition-opacity duration-150 ease-out hover:opacity-80 disabled:opacity-60"
        >
          {isPending ? "Revoking…" : "Revoke the key"}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value.trim())}
            placeholder="0x… agent address"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-md bg-surface-subtle px-3 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-ink-subtle"
          />
          <button
            type="button"
            onClick={() => submit(value)}
            disabled={isPending || value.length === 0}
            className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? "Delegating…" : "Delegate weights"}
          </button>
        </div>
      )}
      {error ? <p className="text-[11px] text-negative">{error}</p> : null}
    </div>
  );
};
