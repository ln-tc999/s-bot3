import Link from "next/link";
import { TokenStack } from "@/components/ui/TokenStack";
import type { LiveIndex } from "@/lib/chain/registry";
import { cn } from "@/lib/cn";
import type { Constituent } from "@/types/index-fund";

const MAX_TOKENS = 5;

/** One face for a whole collection: the distinct tokens its indexes hold. */
const toFace = (indexes: LiveIndex[]): Constituent[] => {
  const seen = new Map<string, Constituent>();

  for (const index of indexes) {
    for (const constituent of index.constituents) {
      if (!seen.has(constituent.token.symbol)) {
        seen.set(constituent.token.symbol, constituent);
      }
    }
  }

  return [...seen.values()].slice(0, MAX_TOKENS);
};

interface CollectionTileProps {
  href: string;
  title: string;
  indexes: LiveIndex[];
  isActive: boolean;
}

export const CollectionTile = ({
  href,
  title,
  indexes,
  isActive,
}: CollectionTileProps) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "flex flex-col items-center gap-5 rounded-2xl px-5 py-7 transition-colors duration-150 ease-out",
      isActive
        ? "bg-surface shadow-raised ring-1 ring-accent/40"
        : "bg-surface-subtle hover:bg-surface",
    )}
  >
    <TokenStack constituents={toFace(indexes)} size="lg" maxVisible={5} />
    <span className="flex items-baseline gap-1.5">
      <span
        className={cn(
          "text-sm",
          isActive ? "font-semibold text-ink" : "font-medium text-ink-muted",
        )}
      >
        {title}
      </span>
      <span className="text-xs tabular-nums text-ink-subtle">
        {indexes.length}
      </span>
    </span>
  </Link>
);
