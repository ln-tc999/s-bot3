"use client";

import { StarFourIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";

const CLICK_FEEDBACK_MS = 200;

interface GlowButtonProps {
  label?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export const GlowButton = ({
  label = "Generate",
  href,
  onClick,
  className,
}: GlowButtonProps) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), CLICK_FEEDBACK_MS);
    onClick?.();
  };

  const content = (
    <span className="flex items-center justify-center gap-1.5">
      {label}
      <StarFourIcon size={16} weight="fill" aria-hidden />
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={cn("glow-btn", className)}
        onClick={handleClick}
        data-state={isClicked ? "clicked" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={cn("glow-btn", className)}
      onClick={handleClick}
      data-state={isClicked ? "clicked" : undefined}
    >
      {content}
    </button>
  );
};
