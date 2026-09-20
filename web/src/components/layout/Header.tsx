"use client";

import { SignOutIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/onchain/WalletProvider";
import { BAR_ICON, GLASS, PILL } from "./chrome";

/**
 * One row per wallet that announced itself over EIP-6963. Shown only when more
 * than one is installed — with a single wallet the picker would be a click
 * between the visitor and the thing they already meant to do.
 */
const WalletPicker = ({
  onPick,
  onDismiss,
}: {
  onPick: (rdns: string) => void;
  onDismiss: () => void;
}) => {
  const { wallets } = useWallet();

  return (
    <>
      {/* A backdrop is how this closes on an outside click, with no document listener. */}
      <button
        type="button"
        aria-label="Close wallet picker"
        onClick={onDismiss}
        className="fixed inset-0 z-40 cursor-default"
      />
      <div
        className={cn(
          GLASS,
          "absolute top-full left-0 z-50 mt-2 flex w-60 flex-col gap-0.5 rounded-[8px] p-1.5",
        )}
      >
        {wallets.map((wallet) => (
          <button
            key={wallet.rdns}
            type="button"
            onClick={() => onPick(wallet.rdns)}
            className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-surface-hover"
          >
            {/* biome-ignore lint/performance/noImgElement: the icon is a data URI the wallet supplies at runtime */}
            <img src={wallet.icon} alt="" className="size-5 rounded-[4px]" />
            <span className="truncate">{wallet.name}</span>
          </button>
        ))}
      </div>
    </>
  );
};

const WalletControl = () => {
  const {
    address,
    hasProvider,
    isConnecting,
    isBotChain,
    wallets,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();
  const [isPicking, setIsPicking] = useState(false);

  if (!hasProvider) {
    return (
      <a
        href="https://ethereum.org/en/wallets/find-wallet/"
        target="_blank"
        rel="noreferrer"
        className={PILL}
      >
        Get a wallet
      </a>
    );
  }

  if (!address) {
    const needsChoice = wallets.length > 1;

    return (
      <span className="relative">
        <button
          type="button"
          onClick={() => (needsChoice ? setIsPicking(true) : connect())}
          disabled={isConnecting}
          className={cn(PILL, "disabled:opacity-60")}
        >
          {isConnecting ? "Connecting…" : "Connect wallet"}
        </button>

        {isPicking && needsChoice ? (
          <WalletPicker
            onPick={(rdns) => {
              setIsPicking(false);
              connect(rdns);
            }}
            onDismiss={() => setIsPicking(false)}
          />
        ) : null}
      </span>
    );
  }

  if (!isBotChain) {
    return (
      <button
        type="button"
        onClick={switchNetwork}
        className="flex h-[42px] min-w-0 items-center gap-1.5 rounded-[8px] bg-negative px-3 text-sm font-medium text-ink-inverse transition-opacity duration-150 ease-out hover:opacity-90"
      >
        <WarningIcon size={14} weight="fill" aria-hidden className="shrink-0" />
        <span className="truncate">Switch network</span>
      </button>
    );
  }

  return (
    <span className="flex h-[42px] min-w-0 items-center gap-1.5">
      <span className="size-7 shrink-0 rounded-full bg-accent" aria-hidden />
      <span className="hidden min-w-0 truncate font-mono text-sm font-medium text-ink sm:block">
        {truncateAddress(address)}
      </span>
      <button
        type="button"
        onClick={disconnect}
        title="Disconnect wallet"
        className={cn(BAR_ICON, "shrink-0 hover:text-negative")}
      >
        <SignOutIcon size={15} weight="bold" aria-hidden />
        <span className="sr-only">Disconnect wallet</span>
      </button>
    </span>
  );
};

/**
 * The wallet and nothing else, with no panel behind it. It stays sticky so the
 * control never scrolls out of reach, which means page content passes under it:
 * the disconnected state carries its own solid fill, so it stays legible either
 * way.
 */
export const Header = () => (
  <header className="sticky top-3 z-30 flex justify-end px-4 pt-1 lg:top-4 lg:px-8">
    <WalletControl />
  </header>
);
