import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { formatSignedPercent } from "@/lib/format";

interface ReturnValueProps {
  value: number;
  className?: string;
}

export const ReturnValue = ({ value, className }: ReturnValueProps) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const TrendIcon = isPositive ? TrendUpIcon : TrendDownIcon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium tabular-nums",
        isPositive && "text-positive",
        isNegative && "text-negative",
        !isPositive && !isNegative && "text-ink-muted",
        className,
      )}
    >
      {formatSignedPercent(value)}
      {isPositive || isNegative ? (
        <TrendIcon size={14} weight="bold" aria-hidden />
      ) : null}
    </span>
  );
};
