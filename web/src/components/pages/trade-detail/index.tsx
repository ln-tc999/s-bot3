import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import type { LiveIndex } from "@/lib/chain/registry";
import { fetchBasketTokens } from "@/lib/chain/tokenbook";
import { fetchVaultSummary } from "@/lib/chain/vault.read";
import { TradePanel } from "./components/TradePanel";
import { VaultStats } from "./components/VaultStats";

interface TradeDetailPageProps {
  index: LiveIndex;
}

export const TradeDetailPage = async ({ index }: TradeDetailPageProps) => {
  const back = (
    <Link
      href={indexHref(index.label)}
      className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink"
    >
      <ArrowLeftIcon size={16} weight="bold" aria-hidden />
      {index.name}
    </Link>
  );

  if (!index.vault) {
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <EmptyState
            title="This index has no share token yet"
            description="Its owner has to deploy the vault that settles it before anyone can subscribe."
            action={
              <ButtonLink href={indexHref(index.label)} variant="secondary">
                Open the index
              </ButtonLink>
            }
          />
        </Card>
      </div>
    );
  }

  const [tokens, vault] = await Promise.all([
    fetchBasketTokens(index.constituents.map((entry) => entry.token.symbol)),
    fetchVaultSummary(index.vault),
  ]);

  /**
   * A constituent with no token bound to its symbol cannot be delivered, so the
   * basket cannot be assembled at all. Saying so beats rendering a form whose
   * only possible outcome is a revert.
   */
  if (!tokens || !vault) {
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <EmptyState
            title="Not settleable yet"
            description="At least one of this index's symbols has no token bound to it in the TokenBook, so the basket cannot be assembled."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {back}

      <header className="flex items-start gap-4">
        <TokenStack
          constituents={index.constituents}
          size="lg"
          maxVisible={4}
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {`Trade ${index.name}`}
          </h1>
          <p className="text-sm text-ink-muted">
            Subscribing delivers the basket itself, in the weights this index
            publishes right now. Redeeming returns a pro rata slice of what the
            vault holds.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TradePanel
            index={index}
            vault={index.vault}
            tokens={tokens}
            feeBps={vault.feeBps}
            ownerFeeBps={vault.ownerFeeBps}
            initialNavWei={vault.navWei}
          />
        </div>
        <div className="lg:col-span-2">
          <VaultStats vault={vault} />
        </div>
      </div>
    </div>
  );
};
