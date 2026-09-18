import { cn } from "@/lib/cn";
import type { Constituent } from "@/types/index-fund";
import { TOKEN_ICON_PIXELS, TokenIcon, type TokenIconSize } from "./TokenIcon";

const OVERFLOW_TEXT_CLASS: Record<TokenIconSize, string> = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-xs",
};

interface TokenStackProps {
  constituents: Constituent[];
  size?: TokenIconSize;
  maxVisible?: number;
  className?: string;
}

export const TokenStack = ({
  constituents,
  size = "md",
  maxVisible = 4,
  className,
}: TokenStackProps) => {
  const visible = constituents.slice(0, maxVisible);
  const overflowCount = constituents.length - visible.length;
  const pixels = TOKEN_ICON_PIXELS[size];

  return (
    <ul className={cn("flex items-center", className)}>
      {visible.map((constituent) => (
        <li key={constituent.token.symbol} className="-ml-2 first:ml-0">
          <TokenIcon token={constituent.token} size={size} />
        </li>
      ))}
      {overflowCount > 0 ? (
        <li
          className={cn(
            "-ml-2 flex items-center justify-center rounded-full bg-ink font-semibold text-ink-inverse ring-2 ring-surface",
            OVERFLOW_TEXT_CLASS[size],
          )}
          style={{ width: pixels, height: pixels }}
        >
          {`+${overflowCount}`}
        </li>
      ) : null}
    </ul>
  );
};
