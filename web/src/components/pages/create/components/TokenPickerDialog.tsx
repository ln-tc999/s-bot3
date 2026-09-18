"use client";

import {
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRef, useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { TOKENS } from "@/lib/tokens/registry";
import type { TokenSymbol } from "@/types/index-fund";

interface TokenPickerDialogProps {
  availableSymbols: readonly TokenSymbol[];
  onSelect: (symbol: TokenSymbol) => void;
}

export const TokenPickerDialog = ({
  availableSymbols,
  onSelect,
}: TokenPickerDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();
  const results = availableSymbols.filter(
    (symbol) =>
      term.length === 0 ||
      symbol.includes(term) ||
      TOKENS[symbol].name.toLowerCase().includes(term),
  );

  const openDialog = () => {
    setQuery("");
    dialogRef.current?.showModal();
  };

  const chooseToken = (symbol: TokenSymbol) => {
    onSelect(symbol);
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={availableSymbols.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong px-4 py-3 text-sm font-medium text-ink-muted transition-colors duration-150 ease-out hover:border-accent hover:text-accent-ink disabled:pointer-events-none disabled:opacity-50"
      >
        <PlusIcon size={16} weight="bold" aria-hidden />
        Add a token
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="token-picker-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-floating backdrop:bg-ink/40"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2
            id="token-picker-title"
            className="text-sm font-semibold text-ink"
          >
            Add a token
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-md p-1 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink"
          >
            <XIcon size={16} aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="relative px-5 py-4">
          <label htmlFor="token-search" className="sr-only">
            Search tokens
          </label>
          <MagnifyingGlassIcon
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-8 -translate-y-1/2 text-ink-subtle"
          />
          <input
            id="token-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or symbol"
            autoComplete="off"
            className="w-full rounded-md border border-line bg-surface-subtle py-2.5 pr-3 pl-9 text-sm text-ink placeholder:text-ink-subtle"
          />
        </div>

        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto px-3 pb-3">
            {results.map((symbol) => (
              <li key={symbol}>
                <button
                  type="button"
                  onClick={() => chooseToken(symbol)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150 ease-out hover:bg-surface-hover"
                >
                  <TokenIcon token={TOKENS[symbol]} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {TOKENS[symbol].name}
                    </span>
                    <span className="block text-xs uppercase text-ink-subtle">
                      {symbol}
                    </span>
                  </span>
                  <PlusIcon
                    size={16}
                    aria-hidden
                    className="shrink-0 text-ink-subtle"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 pb-6 text-sm text-ink-muted">
            {`No token matches "${query}".`}
          </p>
        )}
      </dialog>
    </>
  );
};
