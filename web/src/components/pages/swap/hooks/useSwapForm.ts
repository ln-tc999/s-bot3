"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { QUOTE, QUOTE_PRICE_USD } from "@/lib/chain/quote";
import type { LiveIndex } from "@/lib/chain/registry";
import { SHARE_DECIMALS } from "@/lib/chain/vault";
import { toFloat, usePortfolio } from "@/lib/onchain/PortfolioProvider";
import type { SwapMode } from "@/types/index-fund";

const AMOUNT_PATTERN = /^\d*\.?\d*$/;

export interface SwapSide {
  symbol: string;
  amount: number;
  balance: number;
  valueUsd: number;
}

interface UseSwapFormOptions {
  live: LiveIndex;
  alternate: LiveIndex | undefined;
}

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

const parseAmount = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIndexSymbol = (live: LiveIndex): string => live.label.toUpperCase();

/**
 * Every number here comes from the vault: the share price is read from the
 * contract that will actually settle the trade, so the preview and the receipt
 * cannot disagree.
 */
export const useSwapForm = ({ live, alternate }: UseSwapFormOptions) => {
  const { sharePrices, shares, quoteBalance: quoteBalanceWei } = usePortfolio();
  const [mode, setMode] = useState<SwapMode>("deposit");
  const [amountInput, setAmountInput] = useState("");

  const quote = QUOTE;
  /**
   * The deployed ERC20 calls itself `mUSDC`. The `m` says "mock", which the
   * network already says, so the interface spells the ticker it stands for.
   */
  const quoteSymbol = QUOTE.ticker;
  const quotePriceUsd = QUOTE_PRICE_USD;

  const unitPriceUsd = (slug: string): number =>
    toFloat(sharePrices[slug] ?? 0n, quote.decimals) * quotePriceUsd;

  const indexPriceUsd = unitPriceUsd(live.label);
  const alternatePriceUsd = alternate ? unitPriceUsd(alternate.label) : 0;

  const quoteBalance = toFloat(quoteBalanceWei, quote.decimals);
  const indexBalance = toFloat(shares[live.label] ?? 0n, SHARE_DECIMALS);
  const alternateBalance = alternate
    ? toFloat(shares[alternate.label] ?? 0n, SHARE_DECIMALS)
    : 0;

  const amount = parseAmount(amountInput);
  const indexSymbol = toIndexSymbol(live);
  const alternateSymbol = alternate ? toIndexSymbol(alternate) : "—";

  const convert = (value: number): number => {
    if (indexPriceUsd === 0) {
      return 0;
    }
    if (mode === "deposit") {
      return (value * quotePriceUsd) / indexPriceUsd;
    }
    if (mode === "redeem") {
      return (value * indexPriceUsd) / quotePriceUsd;
    }
    return alternatePriceUsd === 0
      ? 0
      : (value * indexPriceUsd) / alternatePriceUsd;
  };

  const receivedAmount = convert(amount);

  const payment: SwapSide =
    mode === "deposit"
      ? {
          symbol: quoteSymbol,
          amount,
          balance: quoteBalance,
          valueUsd: amount * quotePriceUsd,
        }
      : {
          symbol: indexSymbol,
          amount,
          balance: indexBalance,
          valueUsd: amount * indexPriceUsd,
        };

  const receipt: SwapSide =
    mode === "redeem"
      ? {
          symbol: quoteSymbol,
          amount: receivedAmount,
          balance: quoteBalance,
          valueUsd: receivedAmount * quotePriceUsd,
        }
      : {
          symbol: mode === "deposit" ? indexSymbol : alternateSymbol,
          amount: receivedAmount,
          balance: mode === "deposit" ? indexBalance : alternateBalance,
          valueUsd:
            receivedAmount *
            (mode === "deposit" ? indexPriceUsd : alternatePriceUsd),
        };

  const changeAmount = (value: string) => {
    if (AMOUNT_PATTERN.test(value)) {
      setAmountInput(value);
    }
  };

  const changeMode = (nextMode: SwapMode) => {
    setMode(nextMode);
    setAmountInput("");
  };

  return {
    mode,
    amountInput,
    payment,
    receipt,
    quote,
    quoteSymbol,
    unitPriceUsd: indexPriceUsd,
    previewRate: convert(1),
    indexSymbol,
    alternateSymbol,
    hasAmount: amount > 0,
    isOverBalance: amount > payment.balance,
    /** The exact integer the contract call takes, never re-derived from a float. */
    payAmountWei: toWei(
      amountInput,
      mode === "deposit" ? quote.decimals : SHARE_DECIMALS,
    ),
    changeMode,
    changeAmount,
    setMaxAmount: () => setAmountInput(String(payment.balance)),
  };
};
