import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperDesignBackground } from "@/components/ui/neon-dither";
import { fetchIndexes } from "@/lib/chain/registry";
import { selectedChainId } from "@/lib/chain/selected.server";
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
   * before it can render anything. Which registry is the visitor's network —
   * there are two, and neither is a default: they only happen to share an
   * address across the deployer's nonce, which is what made this wrong before.
   */
  const chainId = await selectedChainId();
  const liveIndexes = await fetchIndexes(chainId).catch(() => []);

  return (
    <>
      <PaperDesignBackground themeMode="system" intensity={0.8} parallax />
      <WalletProvider initialChainId={chainId}>
        <PortfolioProvider liveIndexes={liveIndexes}>
          <AppShell>{children}</AppShell>
        </PortfolioProvider>
      </WalletProvider>
    </>
  );
}
