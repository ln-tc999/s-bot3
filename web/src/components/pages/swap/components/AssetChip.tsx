import type { ReactNode } from "react";

export const CHIP_CLASS =
  "flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-3 pl-1.5 text-sm font-semibold text-ink";

interface AssetChipProps {
  icon: ReactNode;
  label: ReactNode;
}

export const AssetChip = ({ icon, label }: AssetChipProps) => (
  <span className={CHIP_CLASS}>
    {icon}
    {label}
  </span>
);
