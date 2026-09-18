import { TokenIcon } from "@/components/ui/TokenIcon";
import { formatWeight } from "@/lib/format";
import type { Constituent } from "@/types/index-fund";

const HEADER_CLASS = "px-5 py-3 text-xs font-medium text-ink-subtle";

interface ConstituentTableProps {
  constituents: Constituent[];
}

export const ConstituentTable = ({ constituents }: ConstituentTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[32rem] border-collapse text-left">
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={HEADER_CLASS}>
            Token
          </th>
          <th scope="col" className={HEADER_CLASS}>
            Published symbol
          </th>
          <th scope="col" className={`${HEADER_CLASS} text-right`}>
            Weight
          </th>
        </tr>
      </thead>
      <tbody>
        {constituents.map((constituent) => (
          <tr
            key={constituent.token.symbol}
            className="border-b border-line last:border-b-0"
          >
            <td className="px-5 py-4">
              <span className="flex items-center gap-3">
                <TokenIcon token={constituent.token} size="md" />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {constituent.token.name}
                  </span>
                  <span className="block text-xs uppercase text-ink-subtle">
                    {constituent.token.symbol}
                  </span>
                </span>
              </span>
            </td>
            <td className="px-5 py-4">
              {/*
               * What the contract actually stores for this row. The name and
               * icon beside it are local decoration; this is the record.
               */}
              <span className="font-mono text-xs text-ink-muted">
                {constituent.token.symbol}
              </span>
            </td>
            <td className="px-5 py-4 text-right">
              <span className="text-sm font-semibold tabular-nums text-ink">
                {formatWeight(constituent.weightBps)}
              </span>
              <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-surface-hover">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${constituent.weightBps / 100}%` }}
                />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
