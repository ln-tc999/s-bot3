import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TokenStack } from "@/components/ui/TokenStack";
import { tradeHref } from "@/config/navigation";
import { fetchIndexes } from "@/lib/chain/registry";
import { fetchVaultSummary, type VaultSummary } from "@/lib/chain/vault.read";
import { formatBps, formatUsd } from "@/lib/format";

/**
 * Only indexes with a vault appear here. An index without one is a published
 * record and nothing more — it belongs on Explore, not on a page whose whole
 * purpose is settling against something.
 */
export const TradePage = async () => {
  const indexes = (await fetchIndexes().catch(() => [])).filter(
    (index) => index.vault !== null,
  );

  const vaults = await Promise.all(
    indexes.map((index) =>
      fetchVaultSummary(index.vault as `0x${string}`).catch(() => null),
    ),
  );

  const tradeable = indexes.flatMap((index, position) => {
    const vault = vaults[position];
    return vault ? [{ index, vault }] : [];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trade"
        description="Subscribe by delivering the basket an index publishes, or redeem for a pro rata slice of what its vault holds."
      />

      <Card>
        <CardHeader title={`${tradeable.length} tradeable`} />

        {tradeable.length === 0 ? (
          <EmptyState
            title="Nothing is settleable yet"
            description="An index becomes tradeable once its owner deploys the vault that settles it."
            action={<ButtonLink href="/explore">Browse indexes</ButtonLink>}
          />
        ) : (
          <ul className="divide-y divide-line px-5 pb-2">
            {tradeable.map(({ index, vault }) => (
              <TradeRow key={index.label} index={index} vault={vault} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

interface TradeRowProps {
  index: Awaited<ReturnType<typeof fetchIndexes>>[number];
  vault: VaultSummary;
}

const TradeRow = ({ index, vault }: TradeRowProps) => (
  <li className="flex flex-wrap items-center gap-4 py-4">
    <TokenStack constituents={index.constituents} size="sm" maxVisible={3} />

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-ink">{index.name}</p>
      <p className="font-mono text-[11px] text-ink-subtle">{index.label}</p>
    </div>

    <dl className="flex items-center gap-6 text-right">
      <div>
        <dt className="text-[11px] text-ink-subtle">NAV</dt>
        <dd className="tabular-nums text-sm text-ink">
          {formatUsd(vault.navPerShare)}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] text-ink-subtle">Drift</dt>
        <dd className="tabular-nums text-sm text-ink">
          {formatBps(vault.driftBps)}
        </dd>
      </div>
      <div className="hidden sm:block">
        <dt className="text-[11px] text-ink-subtle">Fee</dt>
        <dd className="tabular-nums text-sm text-ink">
          {formatBps(vault.feeBps)}
        </dd>
      </div>
    </dl>

    <ButtonLink href={tradeHref(index.label)} variant="secondary">
      Trade
    </ButtonLink>
  </li>
);
