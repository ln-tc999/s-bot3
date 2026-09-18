"use client";

import { cn } from "@/lib/cn";
import { SWAP_MODES, type SwapMode } from "@/types/index-fund";

const MODE_LABEL: Record<SwapMode, string> = {
  deposit: "Deposit",
  swap: "Swap",
  redeem: "Redeem",
};

interface ModeTabsProps {
  mode: SwapMode;
  onModeChange: (mode: SwapMode) => void;
}

export const ModeTabs = ({ mode, onModeChange }: ModeTabsProps) => (
  <div
    role="tablist"
    aria-label="Swap mode"
    className="mx-auto flex w-fit items-center gap-1 rounded-full bg-surface-subtle p-1"
  >
    {SWAP_MODES.map((value) => (
      <button
        key={value}
        type="button"
        role="tab"
        aria-selected={mode === value}
        onClick={() => onModeChange(value)}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm transition-colors duration-150 ease-out",
          mode === value
            ? "bg-surface font-semibold text-ink shadow-raised"
            : "font-medium text-ink-subtle hover:text-ink",
        )}
      >
        {MODE_LABEL[value]}
      </button>
    ))}
  </div>
);
