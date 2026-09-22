import { ArrowLeftIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { TokenStack } from "@/components/ui/TokenStack";
import type { LiveIndex } from "@/lib/chain/registry";
import { ConstituentTable } from "./components/ConstituentTable";
import { OnchainPanel } from "./components/OnchainPanel";
import { RebalancerCard } from "./components/RebalancerCard";
import { ShareTokenCard } from "./components/ShareTokenCard";

interface IndexDetailPageProps {
  index: LiveIndex;
}

export const IndexDetailPage = ({ index }: IndexDetailPageProps) => (
  <div className="space-y-6">
    <Link
      href="/explore"
      className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
    >
      <ArrowLeftIcon size={16} weight="bold" aria-hidden />
      Explore
    </Link>

    <header className="flex flex-wrap items-start justify-between gap-6">
      <div className="flex items-start gap-4">
        <TokenStack
          constituents={index.constituents}
          size="lg"
          maxVisible={4}
        />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {index.name}
            </h1>
            {index.isLocked ? (
              <Badge tone="positive">
                <LockSimpleIcon size={12} weight="fill" aria-hidden />
                Locked
              </Badge>
            ) : null}
          </div>
          <p className="flex items-center gap-1">
            <span className="font-mono text-sm text-ink-muted">
              {index.label}
            </span>
            <CopyButton value={index.label} label="Copy label" size={14} />
          </p>
        </div>
      </div>
    </header>

    {index.methodology ? (
      <Card>
        <CardHeader
          title="Methodology"
          action={
            <span className="text-xs text-ink-subtle">
              {index.isLocked ? "Frozen onchain" : "Editable by the owner"}
            </span>
          }
        />
        <p className="whitespace-pre-wrap px-5 pb-5 text-sm text-ink-muted">
          {index.methodology}
        </p>
      </Card>
    ) : null}

    <Card className="overflow-hidden">
      <CardHeader
        title="Constituents"
        action={
          <span className="text-xs text-ink-subtle">
            {`${index.constituents.length} published, 10,000 bps total`}
          </span>
        }
      />
      <ConstituentTable constituents={index.constituents} />
    </Card>

    <div className="grid gap-4 lg:grid-cols-2">
      <OnchainPanel index={index} />
      <ShareTokenCard
        label={index.label}
        name={index.name}
        owner={index.owner}
        vault={index.vault}
        constituents={index.constituents}
      />
      <RebalancerCard index={index} />
    </div>
  </div>
);
