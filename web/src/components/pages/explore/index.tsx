import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { sumLiquidity } from "@/lib/chain/liquidity";
import { fetchIndexes, type LiveIndex } from "@/lib/chain/registry";
import { CollectionTile } from "./components/CollectionTile";
import { IndexTable } from "./components/IndexTable";
import { LiquidityTile } from "./components/LiquidityTile";

const ALL_ID = "all";

interface Facet {
  id: string;
  title: string;
  matches: (index: LiveIndex) => boolean;
}

/**
 * Facets, not categories. A category would be an opinion this app holds about
 * an index; each of these is a fact the index publishes about itself.
 */
const FACETS: Facet[] = [
  { id: ALL_ID, title: "All indexes", matches: () => true },
  {
    id: "locked",
    title: "Locked methodology",
    matches: (index) => index.isLocked,
  },
];

interface ExplorePageProps {
  collection?: string;
}

export const ExplorePage = async ({ collection }: ExplorePageProps) => {
  const indexes = await fetchIndexes().catch(() => []);
  const liquidity = await sumLiquidity(indexes).catch(() => ({
    totalUsd: 0,
    vaultCount: 0,
  }));

  const activeId = FACETS.some((facet) => facet.id === collection)
    ? (collection as string)
    : ALL_ID;
  const active = FACETS.find((facet) => facet.id === activeId) ?? FACETS[0];

  const rows = indexes
    .filter(active.matches)
    .sort((first, second) => first.name.localeCompare(second.name));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore"
        description="Every index published to the registry, read straight from the contract."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {FACETS.map((facet) => (
          <CollectionTile
            key={facet.id}
            href={
              facet.id === ALL_ID
                ? "/explore"
                : `/explore?collection=${facet.id}`
            }
            title={facet.title}
            indexes={indexes.filter(facet.matches)}
            isActive={facet.id === activeId}
          />
        ))}
        <LiquidityTile
          totalUsd={liquidity.totalUsd}
          vaultCount={liquidity.vaultCount}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title={active.title}
          action={
            <span className="text-xs text-ink-subtle">
              {rows.length === 1 ? "1 index" : `${rows.length} indexes`}
            </span>
          }
        />
        {rows.length > 0 ? (
          <IndexTable indexes={rows} />
        ) : (
          <EmptyState
            title="Nothing here yet"
            description="Nothing matches this filter yet. Publish an index and it appears the moment the transaction lands."
          />
        )}
      </Card>
    </div>
  );
};
