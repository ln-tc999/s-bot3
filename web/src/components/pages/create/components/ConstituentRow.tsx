"use client";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { formatWeight } from "@/lib/format";
import type { Token } from "@/types/index-fund";

const MIN_WEIGHT_BPS = 0;
const MAX_WEIGHT_BPS = 10_000;
const WEIGHT_STEP_BPS = 100;

interface ConstituentRowProps {
  token: Token;
  weightBps: number;
  /** What the contract will actually store for this row. */
  publishedSymbol: string;
  onWeightChange: (weightBps: number) => void;
  onRemove: () => void;
}

/** Every row holds two controls, so it reads as a pill rather than a table line. */
export const ConstituentRow = ({
  token,
  weightBps,
  publishedSymbol,
  onWeightChange,
  onRemove,
}: ConstituentRowProps) => {
  const inputId = `weight-${token.symbol}`;

  return (
    <li className="soft-pill flex items-center gap-4 rounded-[1.15rem] bg-surface-subtle px-4 py-3.5">
      <TokenIcon token={token} size="md" />

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">
          {token.name}
        </span>
        <span className="block truncate font-mono text-xs text-ink-muted">
          {publishedSymbol}
        </span>
      </span>

      <label htmlFor={inputId} className="sr-only">
        {`${token.name} weight`}
      </label>
      <input
        id={inputId}
        type="range"
        min={MIN_WEIGHT_BPS}
        max={MAX_WEIGHT_BPS}
        step={WEIGHT_STEP_BPS}
        value={weightBps}
        onChange={(event) => onWeightChange(Number(event.target.value))}
        className="w-20 shrink-0 accent-accent sm:w-40"
      />

      <span className="w-16 text-right text-sm font-semibold tabular-nums text-ink">
        {formatWeight(weightBps)}
      </span>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-2 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface hover:text-negative"
      >
        <TrashIcon size={16} aria-hidden />
        <span className="sr-only">{`Remove ${token.name}`}</span>
      </button>
    </li>
  );
};
