import { formatUnits } from "viem";
import { TokenIcon } from "@/components/ui/TokenIcon";
import type { BasketToken } from "@/lib/chain/tokenbook";
import { cn } from "@/lib/cn";
import { formatAmount, formatWeight } from "@/lib/format";
import type { Constituent } from "@/types/index-fund";

interface BasketTableProps {
  constituents: Constituent[];
  tokens: BasketToken[];
  /** Quoted by the vault, in each token's own decimals. Empty while loading. */
  amounts: bigint[];
  balances: bigint[];
  /** Subscribing spends these balances; redeeming adds to them. */
  isSpending: boolean;
}

export const BasketTable = ({
  constituents,
  tokens,
  amounts,
  balances,
  isSpending,
}: BasketTableProps) => (
  <ul className="divide-y divide-line">
    {constituents.map((constituent, index) => {
      const token = tokens[index];
      const amount = amounts[index] ?? 0n;
      const balance = balances[index] ?? 0n;
      const isShort = isSpending && amount > balance;

      return (
        <li
          key={constituent.token.symbol}
          className="flex items-center gap-3 py-3"
        >
          <TokenIcon token={constituent.token} size="sm" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {constituent.token.name}
            </p>
            <p className="font-mono text-[11px] text-ink-subtle">
              {formatWeight(constituent.weightBps)} target
            </p>
          </div>

          <div className="text-right">
            <p
              className={cn(
                "tabular-nums text-sm",
                isShort ? "text-negative" : "text-ink",
              )}
            >
              {formatAmount(Number(formatUnits(amount, token?.decimals ?? 18)))}
            </p>
            <p className="tabular-nums text-[11px] text-ink-subtle">
              {isShort ? "not enough — " : "you hold "}
              {formatAmount(
                Number(formatUnits(balance, token?.decimals ?? 18)),
              )}
            </p>
          </div>
        </li>
      );
    })}
  </ul>
);
