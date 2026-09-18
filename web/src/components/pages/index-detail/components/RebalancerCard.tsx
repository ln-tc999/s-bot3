import { RobotIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { explorerAddress } from "@/lib/chain/chains";
import type { LiveIndex } from "@/lib/chain/registry";
import { truncateAddress } from "@/lib/format";
import { DelegateAgentButton } from "./DelegateAgentButton";

interface RebalancerCardProps {
  index: LiveIndex;
}

/**
 * The delegation, stated plainly. The agent holds exactly one capability and
 * the contract is what enforces it — `setWeights` accepts the agent, every
 * other function refuses it, including after the methodology is locked.
 */
export const RebalancerCard = ({ index }: RebalancerCardProps) => (
  <Card>
    <CardHeader
      title="Rebalancer"
      action={
        index.agent ? (
          <Badge tone="accent">
            <RobotIcon size={12} weight="fill" aria-hidden />
            Delegated
          </Badge>
        ) : null
      }
    />

    <div className="space-y-3 px-5 pb-4">
      <p className="text-sm text-ink-muted">
        {index.agent
          ? "This agent may set weights and nothing else. It cannot rewrite the methodology, cannot delegate, and cannot take ownership — after the lock, neither can the owner."
          : "Weights on this index are set by its owner. Delegating an agent hands it the weight key alone, and nothing else it could reach."}
      </p>

      {index.agent ? (
        <dl className="space-y-2 rounded-md bg-surface-subtle p-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Agent</dt>
            <dd>
              <a
                href={explorerAddress(index.agent)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-ink hover:text-accent"
              >
                {truncateAddress(index.agent)}
              </a>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-xs text-ink-subtle">Scoped to</dt>
            <dd className="font-mono text-xs text-ink">setWeights</dd>
          </div>
        </dl>
      ) : null}
    </div>

    <DelegateAgentButton
      label={index.label}
      owner={index.owner}
      agent={index.agent}
    />
  </Card>
);
