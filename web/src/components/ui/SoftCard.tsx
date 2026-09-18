import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SoftCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The same shell the dashboard hero is built from: a puffy outer surface that
 * holds inset panels and pills. Kept as one component so the radii and the
 * padding that separates the layers stay identical everywhere.
 */
export const SoftCard = ({
  title,
  action,
  children,
  className,
}: SoftCardProps) => (
  <section
    className={cn("soft-shell rounded-[1.75rem] bg-surface p-2.5", className)}
  >
    {title ? (
      <header className="flex items-center justify-between gap-4 px-3.5 pt-2.5 pb-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {action}
      </header>
    ) : null}
    {children}
  </section>
);
