"use client";

import { useCallback, useEffect, useState } from "react";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { TxSuccessDialog } from "@/components/ui/TxSuccessDialog";
import { activeChain } from "@/lib/chain/chains";
import { publicClient, readOrFallback } from "@/lib/chain/client";
import type { LiveIndex } from "@/lib/chain/registry";
import type { BasketToken } from "@/lib/chain/tokenbook";
import { UNIT_DECIMALS } from "@/lib/chain/unit";
import { indexVaultAbi, SHARE_DECIMALS } from "@/lib/chain/vault";
import { cn } from "@/lib/cn";
import { formatAmount, formatBps, formatUsd } from "@/lib/format";
import { useVaultActions } from "@/lib/onchain/useVaultActions";
import { useWallet } from "@/lib/onchain/WalletProvider";
import { BasketTable } from "./BasketTable";

const AMOUNT_PATTERN = /^\d*\.?\d*$/;

const MODES = ["subscribe", "redeem"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABEL: Record<Mode, string> = {
  subscribe: "Subscribe",
  redeem: "Redeem",
};

/** `parseUnits` rejects the half typed states an input goes through. */
const toWei = (input: string, decimals: number): bigint => {
  const cleaned = input.replace(/\.$/, "");

  if (!cleaned || cleaned === ".") {
    return 0n;
  }

  try {
    return parseUnits(
      cleaned.startsWith(".") ? `0${cleaned}` : cleaned,
      decimals,
    );
  } catch {
    return 0n;
  }
};

interface TradePanelProps {
  index: LiveIndex;
  vault: `0x${string}`;
  tokens: BasketToken[];
  feeBps: number;
  /** The slice of the fee the index owner is paid. Zero for most indexes. */
  ownerFeeBps: number;
  /** Read on the server, so the first paint is not a $0.00 waiting for an effect. */
  initialNavWei: string;
}

export const TradePanel = ({
  index,
  vault,
  tokens,
  feeBps,
  ownerFeeBps,
  initialNavWei,
}: TradePanelProps) => {
  const { address, epoch } = useWallet();
  const actions = useVaultActions();

  const [mode, setMode] = useState<Mode>("subscribe");
  const [sharesInput, setSharesInput] = useState("");
  const [amounts, setAmounts] = useState<bigint[]>([]);
  const [notional, setNotional] = useState(0n);
  const [balances, setBalances] = useState<bigint[]>([]);
  const [shareBalance, setShareBalance] = useState(0n);
  const [navPerShare, setNavPerShare] = useState(() => BigInt(initialNavWei));
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const shares = toWei(sharesInput, SHARE_DECIMALS);

  /** Balances and the nav, refetched whenever a write bumps the epoch. */
  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch is the refetch trigger a write bumps, not a value this effect reads
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [held, share, nav] = await Promise.all([
        address
          ? Promise.all(
              tokens.map((token) =>
                readOrFallback(
                  `balanceOf(${token.symbol})`,
                  publicClient.readContract({
                    address: token.address,
                    abi: erc20Abi,
                    functionName: "balanceOf",
                    args: [address],
                  }),
                  0n,
                ),
              ),
            )
          : Promise.resolve(tokens.map(() => 0n)),
        address
          ? readOrFallback(
              "shares",
              publicClient.readContract({
                address: vault,
                abi: indexVaultAbi,
                functionName: "balanceOf",
                args: [address],
              }),
              0n,
            )
          : Promise.resolve(0n),
        readOrFallback(
          "navPerShare",
          publicClient.readContract({
            address: vault,
            abi: indexVaultAbi,
            functionName: "navPerShare",
          }),
          0n,
        ),
      ]);

      if (!cancelled) {
        setBalances(held);
        setShareBalance(share);
        setNavPerShare(nav);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [address, epoch, tokens, vault]);

  /**
   * The quote comes from the vault, not from arithmetic here: it reads the
   * weights live, so this is the only number that can tell the truth about what
   * the transaction will actually pull.
   */
  useEffect(() => {
    if (shares === 0n) {
      setAmounts([]);
      setNotional(0n);
      setQuoteError(null);
      return;
    }

    let cancelled = false;

    const quote = async () => {
      try {
        if (mode === "subscribe") {
          const [quoted, required] = await publicClient.readContract({
            address: vault,
            abi: indexVaultAbi,
            functionName: "previewSubscribe",
            args: [shares],
          });

          if (!cancelled) {
            setAmounts([...quoted]);
            setNotional(required);
            setQuoteError(null);
          }
          return;
        }

        const quoted = await publicClient.readContract({
          address: vault,
          abi: indexVaultAbi,
          functionName: "previewRedeem",
          args: [shares],
        });

        if (!cancelled) {
          setAmounts([...quoted]);
          setNotional((shares * navPerShare) / 10n ** BigInt(SHARE_DECIMALS));
          setQuoteError(null);
        }
      } catch {
        if (!cancelled) {
          setAmounts([]);
          setQuoteError("That amount is too small to settle.");
        }
      }
    };

    quote();

    return () => {
      cancelled = true;
    };
  }, [mode, navPerShare, shares, vault]);

  const isSubscribing = mode === "subscribe";

  const short = tokens.flatMap((token, position) =>
    isSubscribing && (amounts[position] ?? 0n) > (balances[position] ?? 0n)
      ? [token.address]
      : [],
  );

  const overBalance = !isSubscribing && shares > shareBalance;
  const isPending = actions.pending !== null;

  const submit = useCallback(() => {
    if (isSubscribing) {
      actions.subscribe(
        vault,
        shares,
        tokens.map((token) => token.address),
        amounts,
      );
      return;
    }

    actions.redeem(vault, shares);
  }, [actions, amounts, isSubscribing, shares, tokens, vault]);

  const canSubmit =
    address !== null &&
    shares > 0n &&
    amounts.length > 0 &&
    short.length === 0 &&
    !overBalance &&
    !isPending;

  return (
    <Card>
      <CardHeader
        title={`${MODE_LABEL[mode]} ${index.name}`}
        action={
          <div className="flex items-center gap-1 rounded-full bg-surface-subtle p-1">
            {MODES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setSharesInput("");
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors duration-150 ease-out",
                  mode === value
                    ? "bg-surface font-semibold text-ink shadow-raised"
                    : "font-medium text-ink-subtle hover:text-ink",
                )}
              >
                {MODE_LABEL[value]}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-4 px-5 pb-5">
        <div className="rounded-xl bg-surface-subtle p-4">
          <div className="flex items-baseline justify-between gap-4">
            <label
              htmlFor="shares"
              className="text-xs font-medium text-ink-subtle"
            >
              Shares
            </label>
            <button
              type="button"
              onClick={() =>
                setSharesInput(formatUnits(shareBalance, SHARE_DECIMALS))
              }
              disabled={isSubscribing || shareBalance === 0n}
              className="text-[11px] font-medium text-accent-ink disabled:opacity-40"
            >
              {`holding ${formatAmount(Number(formatUnits(shareBalance, SHARE_DECIMALS)))}`}
            </button>
          </div>
          <input
            id="shares"
            value={sharesInput}
            onChange={(event) => {
              if (AMOUNT_PATTERN.test(event.target.value)) {
                setSharesInput(event.target.value);
              }
            }}
            inputMode="decimal"
            placeholder="0.0"
            spellCheck={false}
            className="w-full bg-transparent text-2xl font-semibold tabular-nums text-ink outline-none placeholder:text-ink-subtle"
          />
          <p className="text-xs text-ink-muted">
            {notional > 0n
              ? formatUsd(Number(formatUnits(notional, UNIT_DECIMALS)))
              : "—"}
          </p>
        </div>

        <div>
          <p className="pb-1 text-xs font-medium text-ink-subtle">
            {isSubscribing ? "You deliver" : "You receive"}
          </p>
          <BasketTable
            constituents={index.constituents}
            tokens={tokens}
            amounts={amounts}
            balances={balances}
            isSpending={isSubscribing}
          />
        </div>

        <dl className="space-y-2 border-t border-line pt-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-subtle">NAV per share</dt>
            <dd className="tabular-nums text-ink">
              {formatUsd(Number(formatUnits(navPerShare, UNIT_DECIMALS)))}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-subtle">
              {ownerFeeBps === 0
                ? "Fee, kept in the basket"
                : "Fee, split with the owner"}
            </dt>
            <dd className="tabular-nums text-ink">
              {ownerFeeBps === 0
                ? formatBps(feeBps)
                : `${formatBps(feeBps)} (${formatBps(ownerFeeBps)} to the owner)`}
            </dd>
          </div>
        </dl>

        {!isSubscribing ? (
          <p className="text-xs text-ink-muted">
            A redemption pays out a pro rata slice of what the vault actually
            holds, not the published weights — so if the agent has rebalanced
            and subscriptions have not caught up yet, this basket is the real
            mix rather than the target one.
          </p>
        ) : null}

        {quoteError ? (
          <p className="text-xs text-negative">{quoteError}</p>
        ) : null}
        {actions.error ? (
          <p className="text-xs text-negative">{actions.error}</p>
        ) : null}
        {overBalance ? (
          <p className="text-xs text-negative">
            You do not hold that many shares.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={submit} disabled={!canSubmit}>
            {isPending
              ? `${MODE_LABEL[mode]}…`
              : `${MODE_LABEL[mode]} ${index.label}`}
          </Button>

          {/* `faucet()` is a MockERC20 affordance. On mainnet the book binds
              real tokens, which have no such function, so the button would only
              ever revert. */}
          {short.length > 0 && activeChain.testnet ? (
            <Button
              variant="secondary"
              onClick={() => actions.faucet(short)}
              disabled={isPending}
            >
              {actions.pending === "faucet"
                ? "Claiming…"
                : `Get ${short.length} test token${short.length > 1 ? "s" : ""}`}
            </Button>
          ) : null}
        </div>

        {!address ? (
          <p className="text-xs text-ink-muted">Connect a wallet to trade.</p>
        ) : null}
      </div>

      <TxSuccessDialog
        hash={actions.last?.hash ?? null}
        title={
          actions.last?.label === "redeem"
            ? "Redeemed"
            : actions.last?.label === "faucet"
              ? "Test tokens claimed"
              : "Subscribed"
        }
        heading={index.name}
        label={index.label}
        onDismiss={actions.dismiss}
      />
    </Card>
  );
};
