import {
  CaretRightIcon,
  LockSimpleIcon,
  RobotIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TokenStack } from "@/components/ui/TokenStack";
import { indexHref } from "@/config/navigation";
import type { LiveIndex } from "@/lib/chain/registry";

const HEADER_CLASS =
  "h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle bg-surface-subtle/80 align-middle";

interface IndexTableProps {
  indexes: LiveIndex[];
}

export const IndexTable = ({ indexes }: IndexTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[46rem] border-collapse text-left">
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={`${HEADER_CLASS} rounded-tl-xl`}>
            Index Fund
          </th>
          <th scope="col" className={HEADER_CLASS}>
            Holds
          </th>
          <th scope="col" className={HEADER_CLASS}>
            Methodology
          </th>
          <th scope="col" className={`${HEADER_CLASS} rounded-tr-xl text-right`}>
            Action
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {indexes.map((index) => (
          <tr
            key={index.label}
            className="group h-[60px] transition-colors duration-150 ease-out hover-row-green"
          >
            <td className="h-[60px] px-5 align-middle">
              <Link href={indexHref(index.label)} className="block leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink group-hover:text-accent-ink transition-colors">
                    {index.name}
                  </span>
                  {index.isLocked ? (
                    <Badge tone="positive" className="text-[10px] py-0 px-1.5 leading-none">
                      <LockSimpleIcon size={9} weight="fill" />
                      Locked
                    </Badge>
                  ) : null}
                  {index.agent ? (
                    <Badge tone="accent" className="text-[10px] py-0 px-1.5 leading-none">
                      <RobotIcon size={9} weight="fill" />
                      Agent
                    </Badge>
                  ) : null}
                </div>
                <span className="block truncate font-mono text-[11px] text-ink-muted">
                  {index.label}
                </span>
              </Link>
            </td>

            <td className="h-[60px] px-5 align-middle">
              <div className="flex items-center gap-2">
                <TokenStack
                  constituents={index.constituents}
                  size="sm"
                  maxVisible={4}
                />
                <span className="text-xs font-medium text-ink-subtle">
                  ({index.constituents.length})
                </span>
              </div>
            </td>

            <td className="h-[60px] max-w-sm px-5 align-middle">
              <p className="truncate text-xs text-ink-muted">
                {index.methodology || "—"}
              </p>
            </td>

            <td className="h-[60px] px-5 text-right align-middle">
              <Link
                href={indexHref(index.label)}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink shadow-2xs transition-all duration-150 ease-out hover:border-accent hover:bg-accent hover:text-ink-inverse"
              >
                <span>View</span>
                <CaretRightIcon size={11} weight="bold" />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
