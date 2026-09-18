import type { ReactNode } from "react";

interface StatBlockProps {
  label: string;
  value: ReactNode;
  align?: "start" | "end";
}

export const StatBlock = ({
  label,
  value,
  align = "start",
}: StatBlockProps) => (
  <div className={align === "end" ? "text-right" : undefined}>
    <dt className="text-xs font-medium text-ink-subtle">{label}</dt>
    <dd className="mt-1 text-sm font-semibold tabular-nums text-ink">
      {value}
    </dd>
  </div>
);
