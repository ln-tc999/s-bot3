import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { explorerAddress } from "@/lib/chain/chains";
import type { VaultSummary } from "@/lib/chain/vault.read";
import { formatBps, formatUsd, truncateAddress } from "@/lib/format";

interface VaultStatsProps {
  vault: VaultSummary;
}

/**
 * The three numbers that describe a vault, and the one sentence each needs.
 *
 * Drift is the interesting one: it is not a warning, it is the record of a
 * rebalance that the holdings have not caught up with yet.
 */
export const VaultStats = ({ vault }: VaultStatsProps) => (
  <Card>
    <CardHeader
      title="Vault"
      action={
        vault.driftBps > 0 ? (
          <Badge tone="accent">{`${formatBps(vault.driftBps)} drift`}</Badge>
        ) : null
      }
    />
    <dl className="space-y-2.5 px-5 pb-5 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">NAV per share</dt>
        <dd className="tabular-nums text-ink">
          {formatUsd(vault.navPerShare)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Fee</dt>
        <dd className="tabular-nums text-ink">
          {vault.ownerFeeBps === 0
            ? formatBps(vault.feeBps)
            : `${formatBps(vault.feeBps)} — ${formatBps(vault.ownerFeeBps)} to the owner`}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-ink-subtle">Settles in</dt>
        <dd>
          <a
            href={explorerAddress(vault.address)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-ink hover:text-accent"
          >
            {truncateAddress(vault.address)}
          </a>
        </dd>
      </div>
    </dl>

    <p className="border-t border-line px-5 py-4 text-xs text-ink-muted">
      {vault.hasSupply
        ? `NAV rises with ${vault.ownerFeeBps === 0 ? "the fee" : "the part of the fee"} every subscription and redemption leaves behind, and cannot fall${vault.ownerFeeBps === 0 ? "" : " — the owner's slice is capped at the fee, so it can only ever be paid out of what was charged on top"}. Drift is how far the holdings sit from the published weights; it closes as new subscriptions arrive at the current ones, not through trading.`
        : "Nobody holds a share yet, so NAV is still the seed the owner set at deployment."}
    </p>
  </Card>
);
