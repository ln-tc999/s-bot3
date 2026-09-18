import { EmptyState } from "@/components/ui/EmptyState";
import { SoftCard } from "@/components/ui/SoftCard";
import type { AllocationSlice } from "@/lib/portfolio";
import { AllocationRows, MAX_VISIBLE_SLICES } from "./AllocationRows";

interface AllocationCardProps {
  allocation: AllocationSlice[];
}

/** Nothing here is clickable, so it is one inset panel rather than a stack of pills. */
export const AllocationCard = ({ allocation }: AllocationCardProps) => {
  const hiddenCount = allocation.length - MAX_VISIBLE_SLICES;

  return (
    <SoftCard
      title="Look through exposure"
      action={
        hiddenCount > 0 ? (
          <span className="text-xs text-ink-subtle">{`+${hiddenCount} more`}</span>
        ) : null
      }
      className="flex flex-col"
    >
      {allocation.length > 0 ? (
        <AllocationRows
          allocation={allocation}
          className="soft-inset flex-1 rounded-[1.35rem] bg-surface-subtle px-4 py-4"
        />
      ) : (
        <div className="soft-inset flex-1 rounded-[1.35rem] bg-surface-subtle">
          <EmptyState
            title="Nothing to break down"
            description="Deposit into an index to see which tokens you hold through it."
          />
        </div>
      )}
    </SoftCard>
  );
};
