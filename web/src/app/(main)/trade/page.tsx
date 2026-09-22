import type { Metadata } from "next";
import { TradePage } from "@/components/pages/trade";

export const metadata: Metadata = {
  title: "Trade",
  description: "Subscribe and redeem index share tokens in kind, on BOT Chain.",
};

/** Records change only when someone publishes, so a short window is enough. */
export const revalidate = 30;

export default function TradeRoute() {
  return <TradePage />;
}
