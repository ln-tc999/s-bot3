"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { cn } from "@/lib/cn";

const COPIED_MS = 1600;

interface CopyButtonProps {
  value: string;
  label: string;
  size?: number;
  className?: string;
}

export const CopyButton = ({
  value,
  label,
  size = 13,
  className,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      /* Clipboard is blocked in some contexts; the value is on screen anyway. */
    }
  };

  const StateIcon = copied ? CheckIcon : CopyIcon;

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : label}
      className={cn(
        "rounded-md p-1 text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink",
        className,
      )}
    >
      <StateIcon
        size={size}
        weight={copied ? "bold" : "regular"}
        aria-hidden
        className={cn(copied && "text-positive")}
      />
      <span className="sr-only">{copied ? "Copied" : label}</span>
    </button>
  );
};
