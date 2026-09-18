"use client";

import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  CheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { explorerTx } from "@/lib/chain/chains";
import { truncateAddress } from "@/lib/format";
import { CopyButton } from "./CopyButton";

const PANEL = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.12 } },
} as const;

/** The asset lands first, then the tick punches in on top of it. */
const ASSET = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.05, type: "spring", stiffness: 380, damping: 20 },
  },
} as const;

const TICK = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.22, type: "spring", stiffness: 600, damping: 18 },
  },
} as const;

const BODY = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.14, duration: 0.22 } },
} as const;

/** Each fact settles after the body, in the order it is written. */
const ROW = {
  hidden: { opacity: 0, y: 6 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.26 + 0.04 * index, duration: 0.2 },
  }),
} as const;

export interface TxSuccessLeg {
  icon: ReactNode;
  amount: string;
  /** The ticker — USDC, BIG-FIVE. */
  symbol: string;
}

export interface TxSuccessRow {
  label: string;
  value: ReactNode;
}

interface TxSuccessDialogProps {
  /** Non-null opens the dialog. Clearing it in the parent closes it. */
  hash: `0x${string}` | null;
  title: string;
  /** The asset the transaction produced — a token stack, or a single icon. */
  icon?: ReactNode;
  /** What the asset is called, above its name. */
  heading?: string | null;
  label?: string | null;
  /** What moved, from and to. Shown with tickers and icons on both sides. */
  legs?: { pay: TxSuccessLeg; receive: TxSuccessLeg } | null;
  rows?: TxSuccessRow[];
  detail?: string | null;
  onDismiss: () => void;
}

const LegBox = ({
  leg,
  isTarget,
}: {
  leg: TxSuccessLeg;
  isTarget?: boolean;
}) => (
  <div
    className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5 ${
      isTarget ? "border-positive/40 bg-positive/5" : "border-line"
    }`}
  >
    {leg.icon}
    <span className="text-sm font-semibold tabular-nums text-ink">
      {leg.amount}
    </span>
    <span className="max-w-full truncate font-mono text-[11px] font-medium tracking-wide text-ink-subtle">
      {leg.symbol}
    </span>
  </div>
);

export const TxSuccessDialog = ({
  hash,
  title,
  icon,
  heading,
  label,
  legs,
  rows,
  detail,
  onDismiss,
}: TxSuccessDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  /**
   * The dialog element opens immediately so the browser keeps the top layer,
   * the focus trap and Escape. Only its contents animate, and the close is held
   * back until the exit finishes — `close()` would otherwise cut the frame.
   */
  useEffect(() => {
    if (hash) {
      dialogRef.current?.showModal();
      setIsVisible(true);
      return;
    }

    setIsVisible(false);
  }, [hash]);

  const facts: TxSuccessRow[] = [
    ...(rows ?? []),
    ...(hash
      ? [
          {
            label: "Transaction",
            value: (
              <a
                href={explorerTx(hash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-ink transition-colors duration-150 ease-out hover:text-accent"
              >
                {truncateAddress(hash)}
                <ArrowSquareOutIcon size={11} aria-hidden />
              </a>
            ),
          },
        ]
      : []),
  ];

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      onCancel={(event) => {
        event.preventDefault();
        setIsVisible(false);
      }}
      aria-labelledby="tx-success-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm bg-transparent p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
        {isVisible ? (
          <motion.div
            variants={PANEL}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center gap-5 rounded-3xl border border-line bg-surface px-6 pt-8 pb-6 text-center shadow-floating"
          >
            <motion.span variants={ASSET} className="relative inline-flex">
              {icon}
              <motion.span
                variants={TICK}
                className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-positive ring-3 ring-surface"
              >
                <CheckIcon
                  size={13}
                  weight="bold"
                  aria-hidden
                  className="text-ink-inverse"
                />
              </motion.span>
            </motion.span>

            <motion.div
              variants={BODY}
              className="flex w-full flex-col items-center gap-5"
            >
              <div className="w-full space-y-1">
                <h2
                  id="tx-success-title"
                  className="text-base font-semibold text-ink"
                >
                  {title}
                </h2>
                {heading ? (
                  <p className="truncate text-sm font-medium text-ink-muted">
                    {heading}
                  </p>
                ) : null}
                {label ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="truncate font-mono text-xs text-ink-subtle">
                      {label}
                    </span>
                    <CopyButton value={label} label="Copy label" />
                  </span>
                ) : null}
              </div>

              {legs ? (
                <div className="flex w-full items-stretch gap-2">
                  <LegBox leg={legs.pay} />
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center self-center rounded-full border border-line bg-surface-subtle"
                  >
                    <ArrowRightIcon
                      size={13}
                      weight="bold"
                      className="text-ink-muted"
                    />
                  </span>
                  <LegBox leg={legs.receive} isTarget />
                </div>
              ) : null}

              {detail ? (
                <p className="w-full rounded-2xl bg-surface-subtle px-4 py-3 text-sm font-medium tabular-nums text-ink">
                  {detail}
                </p>
              ) : null}

              {facts.length > 0 ? (
                <dl className="w-full text-sm">
                  {facts.map((row, index) => (
                    <motion.div
                      key={row.label}
                      variants={ROW}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      className="flex items-center justify-between gap-4 border-t border-line py-2.5 first:border-t-0"
                    >
                      <dt className="text-xs text-ink-subtle">{row.label}</dt>
                      <dd className="min-w-0 text-right text-xs text-ink">
                        {row.value}
                      </dd>
                    </motion.div>
                  ))}
                </dl>
              ) : null}

              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-ink-inverse transition-colors duration-150 ease-out hover:bg-accent-hover"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
};
