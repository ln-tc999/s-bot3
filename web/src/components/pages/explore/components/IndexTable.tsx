import { LockSimpleIcon, RobotIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import type { LiveIndex } from "@/lib/chain/registry";

const HEADER_CLASS =
  "px-5 py-2.5 text-xs font-medium text-ink-subtle bg-surface-subtle";

interface IndexTableProps {
  indexes: LiveIndex[];
}

/**
 * Every column is a field of the record. There is no number here the chain
 * cannot be asked for directly.
 */
export const IndexTable = ({ indexes }: IndexTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[42rem] border-collapse text-left">
      <thead>
        <tr>
          <th scope="col" className={`${HEADER_CLASS} rounded-l-lg`}>
            Name
          </th>
          <th scope="col" className={HEADER_CLASS}>
            Holds
          </th>
          <th scope="col" className={`${HEADER_CLASS} rounded-r-lg`}>
            Methodology
          </th>
        </tr>
      </thead>
      <tbody>
        {indexes.map((index) => (
          <tr
            key={index.label}
            className="border-b border-line last:border-b-0 transition-colors duration-150 ease-out hover:bg-surface-hover"
          >
            <td className="px-5 py-4">
              <Link href={indexHref(index.label)} className="block">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {index.name}
                  </span>
                  {index.isLocked ? (
                    <LockSimpleIcon
                      size={13}
                      weight="fill"
                      aria-label="Methodology locked"
                      className="text-brand-dark"
                    />
                  ) : null}
                  {index.agent ? (
                    <RobotIcon
                      size={13}
                      weight="fill"
                      aria-label="Rebalancer delegated"
                      className="text-accent"
                    />
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate font-mono text-xs text-ink-muted">
                  {index.label}
                </span>
              </Link>
            </td>
            <td className="px-5 py-4">
              <TokenStack
                constituents={index.constituents}
                size="sm"
                maxVisible={5}
              />
            </td>
            <td className="max-w-md px-5 py-4 text-sm text-ink-muted">
              {index.methodology || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
