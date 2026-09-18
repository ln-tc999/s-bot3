import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchIndexes } from "@/lib/chain/registry";
import { PortfolioProvider } from "@/lib/onchain/PortfolioProvider";
import { WalletProvider } from "@/lib/onchain/WalletProvider";

/** Records only change when someone publishes, so a short window is enough. */
export const revalidate = 30;

interface MainLayoutProps {
  children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  /**
   * Read on the server so the client never pays for the registry round trip
   * before it can render anything.
   */
  const liveIndexes = await fetchIndexes().catch(() => []);

  return (
    <WalletProvider>
      <PortfolioProvider liveIndexes={liveIndexes}>
        <AppShell>{children}</AppShell>
      </PortfolioProvider>
    </WalletProvider>
  );
}
