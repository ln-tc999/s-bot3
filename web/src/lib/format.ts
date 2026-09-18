const BASIS_POINTS_PER_UNIT = 10_000;
const COMPACT_THRESHOLD = 1_000_000;
const SMALL_AMOUNT_THRESHOLD = 1;

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const countFormatter = new Intl.NumberFormat("en-US");

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

const preciseAmountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
});

export const formatUsd = (value: number): string => usdFormatter.format(value);

export const formatUsdCompact = (value: number): string =>
  value >= COMPACT_THRESHOLD
    ? compactUsdFormatter.format(value)
    : usdFormatter.format(value);

export const formatCount = (value: number): string =>
  countFormatter.format(value);

export const formatSignedPercent = (value: number): string =>
  `${percentFormatter.format(value)}%`;

export const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

export const formatBps = (bps: number): string =>
  `${((bps / BASIS_POINTS_PER_UNIT) * 100).toFixed(2)}%`;

export const formatWeight = (weightBps: number): string =>
  `${((weightBps / BASIS_POINTS_PER_UNIT) * 100).toFixed(2)}%`;

export const formatAmount = (value: number): string =>
  value > 0 && value < SMALL_AMOUNT_THRESHOLD
    ? preciseAmountFormatter.format(value)
    : amountFormatter.format(value);

export const truncateAddress = (address: string): string =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const truncateCid = (cid: string): string =>
  `${cid.slice(0, 12)}...${cid.slice(-6)}`;
