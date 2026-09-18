import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Token } from "@/types/index-fund";

export type TokenIconSize = "sm" | "md" | "lg";

export const TOKEN_ICON_PIXELS: Record<TokenIconSize, number> = {
  sm: 20,
  md: 28,
  lg: 40,
};

interface TokenIconProps {
  token: Token;
  size?: TokenIconSize;
  className?: string;
}

export const TokenIcon = ({
  token,
  size = "md",
  className,
}: TokenIconProps) => {
  const pixels = TOKEN_ICON_PIXELS[size];

  return (
    <Image
      src={`/tokens/${token.symbol}.png`}
      alt={token.name}
      width={pixels}
      height={pixels}
      className={cn("rounded-full bg-surface ring-2 ring-surface", className)}
    />
  );
};
