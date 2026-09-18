"use client";

import {
  GlobeHemisphereWestIcon,
  LinkSimpleIcon,
  StackSimpleIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { TokenStack } from "@/components/ui/TokenStack";
import { activeChain } from "@/lib/chain/chains";
import { formatWeight, truncateAddress } from "@/lib/format";
import type { Constituent } from "@/types/index-fund";

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

interface PublishConfirmDialogProps {
  isOpen: boolean;
  name: string;
  label: string;
  constituents: Constituent[];
  totalWeightBps: number;
  owner: `0x${string}` | null;
  isPending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

const Row = ({
  icon: RowIcon,
  label,
  children,
}: {
  icon: typeof UserIcon;
  label: string;
  children: React.ReactNode;
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
 * The last screen before a signature. Publishing used to hang off the form's
 * submit, which meant Enter in the name field registered a name — three steps
 * early and with no way to look at it first.
 */
export const PublishConfirmDialog = ({
  isOpen,
  name,
  label,
  constituents,
  totalWeightBps,
  owner,
  isPending,
  error,
  onConfirm,
  onClose,
}: PublishConfirmDialogProps) => {
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
      aria-labelledby="publish-confirm-title"
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
              id="publish-confirm-title"
              className="text-center text-lg font-semibold tracking-tight text-ink"
            >
              Publish this index
            </h2>

            <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-surface-subtle px-4 py-5 text-center">
              <TokenStack
                constituents={constituents}
                size="lg"
                maxVisible={4}
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  {name}
                </span>
                <span className="mt-0.5 flex items-center justify-center gap-1.5">
                  <span className="font-mono text-xs text-ink-muted">
                    {label}
                  </span>
                </span>
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <Row icon={StackSimpleIcon} label="Constituents">
                <span className="tabular-nums text-ink">
                  {`${constituents.length} · ${formatWeight(totalWeightBps)}`}
                </span>
              </Row>
              <Row icon={LinkSimpleIcon} label="Methodology">
                <span className="text-ink">Editable until you lock it</span>
              </Row>
              <Row icon={UserIcon} label="Owner">
                <span className="font-mono text-xs text-ink">
                  {owner ? truncateAddress(owner) : "—"}
                </span>
              </Row>
              <Row icon={GlobeHemisphereWestIcon} label="Network">
                <span className="text-ink">{activeChain.name}</span>
              </Row>
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              One transaction, signed by you. The index is owned by the wallet
              that publishes it, and the label is taken for good — nobody else
              can publish under it afterwards.
            </p>

            {error ? (
              <p className="mt-3 text-xs text-negative">{error}</p>
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
                className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? "Publishing…" : "Publish index"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
};
