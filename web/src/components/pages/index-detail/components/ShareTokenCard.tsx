"use client";

import { CoinVerticalIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { parseUnits } from "viem";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { tradeHref } from "@/config/navigation";
import { sbot3RegistryAbi } from "@/lib/chain/abi";
import { explorerAddress } from "@/lib/chain/chains";
import { publicClient } from "@/lib/chain/client";
import { registryAddress } from "@/lib/chain/registry";
import { tokenBookAddress } from "@/lib/chain/tokenbook";
import {
  DEFAULT_FEE_BPS,
  DEFAULT_OWNER_FEE_BPS,
  DEFAULT_SEED_NAV,
  MAX_FEE_BPS,
  UNIT_DECIMALS,
} from "@/lib/chain/unit";
import { indexVaultAbi, indexVaultBytecode } from "@/lib/chain/vault";
import { formatBps, truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";
import type { Constituent } from "@/types/index-fund";

interface ShareTokenCardProps {
  label: string;
  name: string;
  owner: `0x${string}`;
  vault: `0x${string}` | null;
  constituents: Constituent[];
}

const FIELD =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

/** A ticker the vault can carry: letters only, at most six, upper case. */
const toTicker = (label: string): string =>
  (label.replace(/[^a-zA-Z]/g, "").slice(0, 6) || "SHARE").toUpperCase();

export const ShareTokenCard = ({
  label,
  name,
  owner,
  vault,
  constituents,
}: ShareTokenCardProps) => {
  const { address, isBotChain, getWalletClient, switchNetwork } = useWallet();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [seed, setSeed] = useState(DEFAULT_SEED_NAV);
  const [fee, setFee] = useState(String(DEFAULT_FEE_BPS));
  const [ownerFee, setOwnerFee] = useState(String(DEFAULT_OWNER_FEE_BPS));
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = address?.toLowerCase() === owner.toLowerCase();
  const book = tokenBookAddress();

  /** Read back as percentages, so the split is legible before it is permanent. */
  const feeSplit = (() => {
    const total = Number(fee) || 0;
    const ownerShare = Math.min(Number(ownerFee) || 0, total);
    return {
      ownerFeeBps: ownerShare,
      fee: formatBps(total),
      ownerShare: formatBps(ownerShare),
      holderShare: formatBps(total - ownerShare),
    };
  })();

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
            Subscriptions deliver this index's constituents themselves and mint
            this token against them. The registry holds it permanently — there
            is no setter that could point this index at a different vault later.
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
              href={tradeHref(label)}
              className="rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90"
            >
              Trade
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const deploy = async () => {
    const registry = registryAddress();

    if (!registry || !book) {
      setError("Settlement is not configured for this deployment.");
      return;
    }

    if (!isBotChain) {
      await switchNetwork();
      return;
    }

    let unitPrices: bigint[];
    let seedNav: bigint;
    try {
      unitPrices = constituents.map((entry) =>
        parseUnits(prices[entry.token.symbol] ?? "", UNIT_DECIMALS),
      );
      seedNav = parseUnits(seed, UNIT_DECIMALS);
    } catch {
      setError("Every price has to be a number.");
      return;
    }

    if (unitPrices.some((price) => price <= 0n) || seedNav <= 0n) {
      setError("Every price and the seed NAV have to be above zero.");
      return;
    }

    const feeBps = Number(fee);
    const ownerFeeBps = Number(ownerFee);

    if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > MAX_FEE_BPS) {
      setError(
        `The fee has to be a whole number of bps, at most ${MAX_FEE_BPS}.`,
      );
      return;
    }

    if (
      !Number.isInteger(ownerFeeBps) ||
      ownerFeeBps < 0 ||
      ownerFeeBps > feeBps
    ) {
      setError("Your slice cannot be more than the fee itself.");
      return;
    }

    setError(null);

    try {
      const client = getWalletClient();

      setStep("Deploying the share token…");
      const deployHash = await client.deployContract({
        abi: indexVaultAbi,
        bytecode: indexVaultBytecode,
        args: [
          name,
          toTicker(label),
          label,
          registry,
          book,
          unitPrices,
          seedNav,
          feeBps,
          ownerFeeBps,
          (address ?? owner) as `0x${string}`,
        ],
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
            ? "Deploy the token this index settles in. Subscriptions deliver the constituents themselves, so it holds a real basket and can only ever hand back a slice of what it actually has."
            : "This index has no share token yet, so it cannot be subscribed to. Only its owner can add one."}
        </p>

        {isOwner ? (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink-subtle">
                Unit price per token
              </p>
              {constituents.map((entry) => (
                <label
                  key={entry.token.symbol}
                  className="flex items-center gap-2"
                >
                  <TokenIcon token={entry.token} size="sm" />
                  <span className="w-16 shrink-0 truncate text-xs text-ink">
                    {entry.token.symbol.toUpperCase()}
                  </span>
                  <input
                    value={prices[entry.token.symbol] ?? ""}
                    onChange={(event) =>
                      setPrices((current) => ({
                        ...current,
                        [entry.token.symbol]: event.target.value.trim(),
                      }))
                    }
                    inputMode="decimal"
                    placeholder="0.00"
                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-subtle">
                  Seed NAV
                </span>
                <input
                  value={seed}
                  onChange={(event) => setSeed(event.target.value.trim())}
                  inputMode="decimal"
                  className={FIELD}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-subtle">
                  Fee, bps
                </span>
                <input
                  value={fee}
                  onChange={(event) => setFee(event.target.value.trim())}
                  inputMode="numeric"
                  className={FIELD}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-subtle">
                  Your slice, bps
                </span>
                <input
                  value={ownerFee}
                  onChange={(event) => setOwnerFee(event.target.value.trim())}
                  inputMode="numeric"
                  className={FIELD}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={deploy}
              disabled={step !== null || !book}
              className="w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-50"
            >
              {step ?? "Enable trading"}
            </button>

            <p className="text-xs leading-relaxed text-ink-subtle">
              The prices are a fixed unit of account, not a feed: they convert a
              weight, which is a share of value, into a quantity of tokens.
            </p>

            <p className="text-xs leading-relaxed text-ink-subtle">
              {feeSplit.ownerFeeBps === 0
                ? `The whole ${feeSplit.fee} fee stays in the basket, so it raises what every holder's share is worth.`
                : `Of the ${feeSplit.fee} fee, ${feeSplit.ownerShare} is paid to you and ${feeSplit.holderShare} stays in the basket for holders. Your slice can never exceed the fee, which is what keeps NAV from falling.`}
            </p>

            <p className="text-xs leading-relaxed text-ink-subtle">
              Every one of these is immutable once deployed. Two signatures: one
              deploys, one attaches, and neither can be undone.
            </p>

            {!book ? (
              <p className="text-xs text-negative">
                No TokenBook is configured, so the constituents cannot be
                resolved to tokens.
              </p>
            ) : null}
          </>
        ) : null}

        {error ? <p className="text-xs text-negative">{error}</p> : null}
      </div>
    </Card>
  );
};
