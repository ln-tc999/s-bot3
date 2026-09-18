import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
    <p className="text-sm font-semibold text-ink">{title}</p>
    <p className="max-w-sm text-sm text-ink-muted">{description}</p>
    {action}
  </div>
);
