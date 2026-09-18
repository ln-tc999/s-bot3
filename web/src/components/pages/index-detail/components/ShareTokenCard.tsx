"use client";

import { CoinVerticalIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { parseUnits } from "viem";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { swapHref } from "@/config/navigation";
import { sbot3RegistryAbi } from "@/lib/chain/abi";
import { explorerAddress } from "@/lib/chain/chains";
import { publicClient } from "@/lib/chain/client";
import { QUOTE, quoteAddress } from "@/lib/chain/quote";
import { registryAddress } from "@/lib/chain/registry";
import { indexVaultAbi, indexVaultBytecode } from "@/lib/chain/vault";
import { truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";

interface ShareTokenCardProps {
  label: string;
  name: string;
  owner: `0x${string}`;
  vault: `0x${string}` | null;
}

const DEFAULT_PRICE = "100";

/** A ticker the vault can carry: letters only, at most six, upper case. */
const toTicker = (label: string): string =>
  (label.replace(/[^a-zA-Z]/g, "").slice(0, 6) || "SHARE").toUpperCase();

export const ShareTokenCard = ({
  label,
  name,
  owner,
  vault,
}: ShareTokenCardProps) => {
  const { address, isBotChain, getWalletClient, switchNetwork } = useWallet();
  const [price, setPrice] = useState(DEFAULT_PRICE);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = address?.toLowerCase() === owner.toLowerCase();
  const quote = quoteAddress();

  if (vault) {
    return (
      <Card>
        <CardHeader
          title="Share token"
          action={
            <Badge tone="positive">
              <CoinVerticalIcon size={12} weight="fill" aria-hidden />
              Tradeable
            </Badge>
          }
        />
        <div className="space-y-3 px-5 pb-5">
          <p className="text-sm text-ink-muted">
            {`Deposits are paid in ${QUOTE.ticker} and settle into this token. The registry holds it permanently — there is no setter that could point this index at a different vault later.`}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href={explorerAddress(vault)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-ink hover:text-accent"
            >
              {truncateAddress(vault)}
            </a>
            <Link
              href={swapHref(label)}
              className="rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90"
            >
              Deposit
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const deploy = async () => {
    const registry = registryAddress();

    if (!registry || !quote) {
      setError("Trading is not configured for this deployment.");
      return;
    }

    if (!isBotChain) {
      await switchNetwork();
      return;
    }

    let sharePrice: bigint;
    try {
      sharePrice = parseUnits(price, QUOTE.decimals);
    } catch {
      setError("That is not a valid price.");
      return;
    }

    if (sharePrice <= 0n) {
      setError("The share price has to be above zero.");
      return;
    }

    setError(null);

    try {
      const client = getWalletClient();

      setStep("Deploying the share token…");
      const deployHash = await client.deployContract({
        abi: indexVaultAbi,
        bytecode: indexVaultBytecode,
        args: [name, toTicker(label), label, quote, sharePrice],
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: deployHash,
      });

      if (!receipt.contractAddress) {
        throw new Error("The deployment produced no contract address.");
      }

      setStep("Attaching it to the index…");
      const attachHash = await client.writeContract({
        address: registry,
        abi: sbot3RegistryAbi,
        functionName: "setVault",
        args: [label, receipt.contractAddress],
      });
      await publicClient.waitForTransactionReceipt({ hash: attachHash });

      globalThis.location.reload();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message.split("\n")[0]
          : "Could not enable trading",
      );
      setStep(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Share token" />
      <div className="space-y-3 px-5 pb-5">
        <p className="text-sm text-ink-muted">
          {isOwner
            ? `Deploy the token this index settles in. It takes ${QUOTE.ticker} at a fixed price and mints shares, so it can only ever owe back what a depositor put in.`
            : "This index has no share token yet, so it cannot be deposited into. Only its owner can add one."}
        </p>

        {isOwner ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-subtle">
                {`Price per share, in ${QUOTE.ticker}`}
              </span>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value.trim())}
                inputMode="decimal"
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </label>

            <button
              type="button"
              onClick={deploy}
              disabled={step !== null || !quote}
              className="w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-50"
            >
              {step ?? "Enable trading"}
            </button>

            <p className="text-xs leading-relaxed text-ink-subtle">
              Two signatures: one deploys the token, one attaches it. The price
              is fixed at deployment and the attachment can never be changed.
            </p>
          </>
        ) : null}

        {error ? <p className="text-xs text-negative">{error}</p> : null}
      </div>
    </Card>
  );
};
