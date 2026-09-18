import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => (
  <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-ink-muted">{description}</p>
      ) : null}
    </div>
    {action}
  </header>
);
