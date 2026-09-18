import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "accent" | "positive";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-surface-hover text-ink-muted",
  accent: "bg-accent-soft text-accent-ink",
  positive: "bg-accent-soft text-positive",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export const Badge = ({
  children,
  tone = "neutral",
  className,
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
      TONE_CLASS[tone],
      className,
    )}
  >
    {children}
  </span>
);
