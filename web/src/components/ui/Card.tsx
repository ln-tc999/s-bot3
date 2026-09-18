import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardTone = "surface" | "subtle" | "accent";

const TONE_CLASS: Record<CardTone, string> = {
  surface: "bg-surface",
  subtle: "bg-surface-subtle",
  accent: "bg-surface-accent",
};

interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  className?: string;
}

export const Card = ({ children, tone = "surface", className }: CardProps) => (
  <section
    className={cn(
      "rounded-2xl border border-line shadow-raised",
      TONE_CLASS[tone],
      className,
    )}
  >
    {children}
  </section>
);

interface CardHeaderProps {
  title: string;
  action?: ReactNode;
}

export const CardHeader = ({ title, action }: CardHeaderProps) => (
  <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
    <h2 className="text-sm font-semibold text-ink">{title}</h2>
    {action}
  </div>
);
