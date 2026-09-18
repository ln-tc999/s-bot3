"use client";

import {
  ArrowRightIcon,
  CoinVerticalIcon,
  GlobeHemisphereWestIcon,
  ReceiptIcon,
  VaultIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { activeChain } from "@/lib/chain/chains";
import { formatAmount, formatUsd, truncateAddress } from "@/lib/format";

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

interface Leg {
  icon: ReactNode;
  amount: number;
  symbol: string;
  valueUsd: number;
}

interface SwapConfirmDialogProps {
  isOpen: boolean;
  title: string;
  confirmLabel: string;
  pay: Leg;
  receive: Leg;
  index: { name: string; label: string; icon: ReactNode };
  unitPriceUsd: number;
  vault: `0x${string}` | null;
  isPending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

const LegBox = ({ leg, isTarget }: { leg: Leg; isTarget?: boolean }) => (
  <div
    className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border border-dashed px-3 py-4 ${
      isTarget ? "border-accent/60 bg-accent-soft/40" : "border-line-strong"
    }`}
  >
    {leg.icon}
    <span className="text-center text-sm font-semibold tabular-nums text-ink">
      {`${formatAmount(leg.amount)} ${leg.symbol}`}
    </span>
    <span className="text-xs tabular-nums text-ink-subtle">
      {formatUsd(leg.valueUsd)}
    </span>
  </div>
);

const Row = ({
  icon: RowIcon,
  label,
  children,
}: {
  icon: typeof VaultIcon;
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="flex items-center gap-2 text-ink-subtle">
      <RowIcon size={15} aria-hidden />
      {label}
    </dt>
    <dd className="text-right">{children}</dd>
  </div>
);

/**
 * The last screen before a signature. Everything it shows is what the
 * transaction will actually do, captured before the dialog opened — the form
 * behind it stays editable, and an edit must not rewrite what was agreed to.
 */
export const SwapConfirmDialog = ({
  isOpen,
  title,
  confirmLabel,
  pay,
  receive,
  index,
  unitPriceUsd,
  vault,
  isPending,
  error,
  onConfirm,
  onClose,
}: SwapConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="swap-confirm-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm bg-transparent p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
        {isOpen ? (
          <motion.div
            variants={PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-3xl border border-line bg-surface p-6 shadow-floating"
          >
            <h2
              id="swap-confirm-title"
              className="text-center text-lg font-semibold tracking-tight text-ink"
            >
              {title}
            </h2>

            <div className="mt-5 flex items-stretch gap-2">
              <LegBox leg={pay} />
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center self-center rounded-full border border-line bg-surface-subtle"
              >
                <ArrowRightIcon
                  size={14}
                  weight="bold"
                  className="text-ink-muted"
                />
              </span>
              <LegBox leg={receive} isTarget />
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-subtle px-3.5 py-3">
              {index.icon}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {index.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-mono text-xs text-ink-muted">
                    {index.label}
                  </span>
                </span>
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <Row icon={CoinVerticalIcon} label="Share price">
                <span className="tabular-nums text-ink">
                  {formatUsd(unitPriceUsd)}
                </span>
              </Row>
              <Row icon={ReceiptIcon} label="Fee">
                <span className="tabular-nums text-positive">0.00%</span>
              </Row>
              <Row icon={VaultIcon} label="Settles in">
                <span className="font-mono text-xs text-ink">
                  {vault ? truncateAddress(vault) : "—"}
                </span>
              </Row>
              <Row icon={GlobeHemisphereWestIcon} label="Network">
                <span className="text-ink">{activeChain.name}</span>
              </Row>
            </dl>

            {error ? (
              <p className="mt-4 text-xs text-negative">{error}</p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-full border border-line px-4 py-3 text-sm font-medium text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover disabled:opacity-60"
              >
                {isPending ? "Confirming…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
};
