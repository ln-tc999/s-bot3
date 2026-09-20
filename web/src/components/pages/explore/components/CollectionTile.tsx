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
      "flex h-[213px] flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all duration-200 ease-out",
      isActive
        ? "bg-surface shadow-raised ring-2 ring-accent/60"
        : "border border-line/60 bg-surface-subtle/80 hover:border-line-strong hover:bg-surface hover:shadow-glass",
    )}
  >
    <div className="flex h-12 items-center justify-center">
      {indexes.length > 0 ? (
        <TokenStack constituents={toFace(indexes)} size="lg" maxVisible={5} />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-surface-hover/60 text-ink-subtle">
          —
        </div>
      )}
    </div>
    <div className="flex flex-col items-center gap-1 text-center">
      <span
        className={cn(
          "text-sm font-semibold tracking-tight",
          isActive ? "text-ink" : "text-ink-muted",
        )}
      >
        {title}
      </span>
      <span className="rounded-full bg-surface-hover/70 px-2.5 py-0.5 font-mono text-xs font-medium tabular-nums text-ink-subtle">
        {indexes.length} {indexes.length === 1 ? "index" : "indexes"}
      </span>
    </div>
  </Link>
);
