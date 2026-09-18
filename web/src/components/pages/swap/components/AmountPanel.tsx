"use client";

import type { ReactNode } from "react";
import { formatAmount, formatUsd } from "@/lib/format";
import type { SwapSide } from "../hooks/useSwapForm";

interface AmountPanelProps {
  label: string;
  side: SwapSide;
  assetControl: ReactNode;
  inputId?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onMax?: () => void;
}

export const AmountPanel = ({
  label,
  side,
  assetControl,
  inputId,
  value,
  onValueChange,
  onMax,
}: AmountPanelProps) => {
  const isEditable = onValueChange !== undefined && inputId !== undefined;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-raised">
      {isEditable ? (
        <label htmlFor={inputId} className="text-sm text-ink-subtle">
          {label}
        </label>
      ) : (
        <span className="text-sm text-ink-subtle">{label}</span>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        {isEditable ? (
          <input
            id={inputId}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            className="w-full min-w-0 bg-transparent text-[2.25rem] leading-none font-medium tracking-tight tabular-nums text-ink outline-none placeholder:text-ink-subtle"
          />
        ) : (
          <output
            htmlFor={inputId}
            className="w-full min-w-0 truncate text-[2.25rem] leading-none font-medium tracking-tight tabular-nums text-ink"
          >
            {side.amount > 0 ? formatAmount(side.amount) : "0"}
          </output>
        )}
        {assetControl}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-xs">
        <span className="tabular-nums text-ink-subtle">
          {formatUsd(side.valueUsd)}
        </span>

        <span className="flex items-center gap-2 text-ink-subtle">
          <span className="tabular-nums">
            {`You have ${formatAmount(side.balance)}`}
          </span>
          {onMax ? (
            <button
              type="button"
              onClick={onMax}
              className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-accent-ink transition-colors duration-150 ease-out hover:bg-accent hover:text-ink-inverse"
            >
              Max
            </button>
          ) : null}
        </span>
      </div>
    </div>
  );
};
