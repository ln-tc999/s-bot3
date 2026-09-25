import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SoftCard } from "@/components/ui/SoftCard";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import { formatUsd } from "@/lib/format";
import type { PortfolioPosition } from "@/lib/portfolio";

interface PositionListProps {
  positions: PortfolioPosition[];
}

/** Each position is a link, so each one is a pill — the same pills the hero uses for its actions. */
export const PositionList = ({ positions }: PositionListProps) => (
  <SoftCard
    title="Positions"
    action={
      positions.length > 0 ? (
        <span className="text-xs text-ink-subtle">
          {positions.length === 1 ? "1 index" : `${positions.length} indexes`}
        </span>
      ) : null
    }
  >
    {positions.length > 0 ? (
      <ul className="space-y-2.5">
        {positions.map((position) => (
          <li key={position.index.label}>
            <Link
              href={indexHref(position.index.label)}
              className="soft-pill flex items-center justify-between gap-4 rounded-[1.15rem] bg-surface-subtle px-4 py-3.5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <TokenStack
                  constituents={position.index.constituents}
                  size="md"
                  maxVisible={3}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {position.index.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-xs text-ink-muted">
                      {position.index.label}
                    </span>
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatUsd(position.valueUsd)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <div className="soft-inset rounded-[1.35rem] bg-surface-subtle">
        <EmptyState
          title="No positions yet"
          description="Subscribe to an index to see it tracked here."
          action={
            <ButtonLink href="/trade">Find one to subscribe to</ButtonLink>
          }
        />
      </div>
    )}
  </SoftCard>
);
