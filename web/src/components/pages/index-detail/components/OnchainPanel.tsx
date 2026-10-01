"use client";

import { LockSimpleIcon, RobotIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { explorerAddress } from "@/lib/chain/chains";
import type { LiveIndex } from "@/lib/chain/registry";
import { registryAddress } from "@/lib/chain/registry";
import { useNetwork } from "@/lib/chain/use-network";
import { truncateAddress } from "@/lib/format";
import { LockMethodologyButton } from "./LockMethodologyButton";

interface OnchainPanelProps {
  index: LiveIndex;
}

const ExplorerLink = ({
  address,
  chainId,
}: {
  address: `0x${string}`;
  chainId: number;
}) => (
  <a
    href={explorerAddress(address, chainId)}
    target="_blank"
    rel="noreferrer"
    className="font-mono text-xs text-ink hover:text-accent"
  >
    {truncateAddress(address)}
  </a>
);

/**
 * Every row is a field of one `getIndex` call. Nothing here is asserted by this
 * app, which is why the lock badge is a badge and not a promise.
 */
export const OnchainPanel = ({ index }: OnchainPanelProps) => {
  /**
   * Follows whichever network the visitor is on, wallet first and cookie
   * otherwise — the same answer the server used to render this page with, so
   * the badge and the explorer link cannot name two different chains.
   */
  const network = useNetwork();
  const registry = registryAddress(network.chainId);

  return (
    <Card>
      <CardHeader
        title="Onchain state"
        action={<Badge tone="positive">{`Live on ${network.name}`}</Badge>}
      />
      <dl className="space-y-2.5 px-5 pb-5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-subtle">Registry</dt>
          <dd>
            {registry ? (
              <ExplorerLink address={registry} chainId={network.chainId} />
            ) : (
              <span className="text-xs text-ink-muted">Not configured</span>
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-subtle">Label</dt>
          <dd className="font-mono text-xs text-ink">{index.label}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-subtle">Owner</dt>
          <dd>
            <ExplorerLink address={index.owner} chainId={network.chainId} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-subtle">Constituents</dt>
          <dd className="tabular-nums text-ink">{index.constituents.length}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-subtle">Published</dt>
          <dd className="tabular-nums text-xs text-ink">
            {new Date(index.createdAt * 1000).toLocaleDateString("en-CA")}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-subtle">Rebalancer</dt>
          <dd>
            {index.agent ? (
              <Badge tone="accent">
                <RobotIcon size={12} weight="fill" aria-hidden />
                Delegated
              </Badge>
            ) : (
              <span className="text-xs text-ink-muted">Owner only</span>
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-subtle">Methodology</dt>
          <dd>
            {index.isLocked ? (
              <Badge tone="positive">
                <LockSimpleIcon size={12} weight="fill" aria-hidden />
                Locked
              </Badge>
            ) : (
              <LockMethodologyButton label={index.label} owner={index.owner} />
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
};
