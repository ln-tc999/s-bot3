"use client";

import {
  CaretDownIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { TokenStack } from "@/components/ui/TokenStack";
import { QUOTE, QUOTE_PRICE_USD } from "@/lib/chain/quote";
import type { LiveIndex } from "@/lib/chain/registry";
import { SHARE_DECIMALS } from "@/lib/chain/vault";
import { cn } from "@/lib/cn";
import { formatAmount, formatUsd } from "@/lib/format";
import { toFloat, usePortfolio } from "@/lib/onchain/PortfolioProvider";
import { CHIP_CLASS } from "./AssetChip";

const PANEL = {
  hidden: { opacity: 0, scale: 0.95, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.12 } },
} as const;

/** Rows land one after another, so a growing list reads rather than appears. */
const ROW = {
  hidden: { opacity: 0, y: 8 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.035 * index, duration: 0.2 },
  }),
} as const;

const matches = (entry: LiveIndex, query: string): boolean => {
  const needle = query.trim().toLowerCase();

  return (
    needle === "" ||
    entry.name.toLowerCase().includes(needle) ||
    entry.label.toLowerCase().includes(needle) ||
    entry.constituents.some((constituent) =>
      constituent.token.symbol.toLowerCase().includes(needle),
    )
  );
};

interface IndexSelectProps {
  /** The index the chip stands for, and the row that reads as chosen. */
  value: LiveIndex;
  options: LiveIndex[];
  /** Names the control for a screen reader — "Index", "Index to receive". */
  fieldLabel: string;
  onChange: (slug: string) => void;
}

/**
 * A native select cannot hold an icon, a name and a price in one row, and on
 * every platform it renders as something other than this app. This is the same
 * control drawn by the app itself.
 */
export const IndexSelect = ({
  value,
  options,
  fieldLabel,
  onChange,
}: IndexSelectProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { sharePrices, shares } = usePortfolio();
  const quote = QUOTE;

  const priceUsd = (label: string) =>
    toFloat(sharePrices[label] ?? 0n, quote.decimals) * QUOTE_PRICE_USD;

  const open = () => {
    setQuery("");
    setIsOpen(true);
    dialogRef.current?.showModal();
  };

  const visible = options.filter((entry) => matches(entry, query));

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={`${fieldLabel}: ${value.name}`}
        className={cn(
          CHIP_CLASS,
          "transition-colors duration-150 ease-out hover:bg-surface-hover",
        )}
      >
        <TokenStack
          constituents={value.constituents}
          size="sm"
          maxVisible={2}
        />
        <span className="font-mono text-[13px] font-medium">{value.label}</span>
        <CaretDownIcon
          size={14}
          weight="bold"
          aria-hidden
          className="text-ink-subtle"
        />
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md bg-transparent p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
          {isOpen ? (
            <motion.div
              variants={PANEL}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex max-h-[80vh] flex-col rounded-3xl border border-line bg-surface p-4 shadow-floating"
            >
              <header className="flex items-center justify-between gap-4 px-2 pt-1">
                <h2 id={titleId} className="text-base font-semibold text-ink">
                  Select an index
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink"
                >
                  <XIcon size={16} aria-hidden />
                  <span className="sr-only">Close</span>
                </button>
              </header>

              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface-subtle px-3.5 py-2.5">
                <MagnifyingGlassIcon
                  size={15}
                  aria-hidden
                  className="shrink-0 text-ink-subtle"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="Search by name, ENS name or token"
                  aria-label="Search indexes"
                  className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                />
              </div>

              <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
                {visible.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-ink-muted">
                    {`Nothing matches "${query.trim()}".`}
                  </p>
                ) : (
                  visible.map((entry, index) => {
                    const isSelected = entry.label === value.label;

                    return (
                      <motion.button
                        key={entry.label}
                        type="button"
                        variants={ROW}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                        onClick={() => {
                          onChange(entry.label);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-150 ease-out hover:bg-surface-hover",
                          isSelected && "bg-accent-soft/50",
                        )}
                      >
                        <TokenStack
                          constituents={entry.constituents}
                          size="md"
                          maxVisible={3}
                        />

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-ink">
                              {entry.name}
                            </span>
                            {isSelected ? (
                              <CheckCircleIcon
                                size={14}
                                weight="fill"
                                aria-hidden
                                className="shrink-0 text-accent"
                              />
                            ) : null}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="truncate font-mono text-xs text-ink-subtle">
                              {entry.label}
                            </span>
                          </span>
                        </span>

                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold tabular-nums text-ink">
                            {formatUsd(priceUsd(entry.label))}
                          </span>
                          <span className="block text-xs tabular-nums text-ink-subtle">
                            {formatAmount(
                              toFloat(
                                shares[entry.label] ?? 0n,
                                SHARE_DECIMALS,
                              ),
                            )}
                          </span>
                        </span>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </dialog>
    </>
  );
};
