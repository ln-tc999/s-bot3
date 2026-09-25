"use client";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useState } from "react";
import { NETWORKS } from "@/config/contracts";
import { cn } from "@/lib/cn";
import { useWallet } from "@/lib/onchain/WalletProvider";
import { GLASS } from "./chrome";

export const NetworkSwitcher = () => {
  const { chainId, switchNetwork, isBotChain } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const activeId = chainId && NETWORKS[chainId] ? chainId : 968;
  const currentNetwork = NETWORKS[activeId];

  const handleSelect = (targetChainId: number) => {
    setIsOpen(false);
    switchNetwork(targetChainId);
  };

  return (
    <div className="relative">
      {/* Network Badge & Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-[42px] items-center gap-2 rounded-[8px] border border-line-strong/60 bg-surface/80 px-3 text-xs font-semibold text-ink shadow-sm transition-all duration-150 ease-out hover:bg-surface-hover hover:border-line-strong",
          !isBotChain && "border-negative/60 bg-negative/10 text-negative",
        )}
      >
        <span className="relative flex size-5 items-center justify-center shrink-0">
          <Image
            src="/tokens/bot.png"
            alt="BOT Chain"
            width={18}
            height={18}
            className="size-4 rounded-full object-cover"
          />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-surface",
              currentNetwork.isTestnet ? "bg-amber-400" : "bg-emerald-400",
            )}
          />
        </span>
        <span className="truncate">{currentNetwork.shortName}</span>
        <CaretDownIcon
          size={12}
          weight="bold"
          className="shrink-0 text-ink-subtle"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close network menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            className={cn(
              GLASS,
              "absolute top-full right-0 z-50 mt-2 flex w-56 flex-col gap-1 rounded-[10px] p-2 shadow-raised",
            )}
          >
            <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              Select Network
            </div>
            {Object.values(NETWORKS).map((net) => {
              const isSelected = activeId === net.chainId;
              return (
                <button
                  key={net.chainId}
                  type="button"
                  onClick={() => handleSelect(net.chainId)}
                  className={cn(
                    "flex items-center justify-between rounded-[6px] px-2.5 py-2 text-left text-xs font-medium transition-colors duration-150 ease-out",
                    isSelected
                      ? "bg-accent-soft text-accent-ink"
                      : "text-ink hover:bg-surface-hover",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        net.isTestnet ? "bg-amber-400" : "bg-emerald-400",
                      )}
                    />
                    <span>{net.name}</span>
                  </div>
                  {isSelected ? (
                    <CheckIcon
                      size={14}
                      weight="bold"
                      className="text-accent"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
};
