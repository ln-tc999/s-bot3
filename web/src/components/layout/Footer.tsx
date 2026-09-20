import Link from "next/link";
import { SITE } from "@/config/site";
import { activeChain, explorerAddress } from "@/lib/chain/chains";
import { registryAddress } from "@/lib/chain/registry";

const LINK_CLASS =
  "text-white/70 transition-colors duration-150 ease-out hover:text-white";

export const Footer = () => {
  const registry = registryAddress();

  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-10 lg:px-8">
      <div className="flex flex-col gap-4 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-white/80">
          {SITE.name} — {SITE.tagline}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs text-white/50">Built on</span>
          <a
            href="https://botchain.ai"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-70"
          >
            BOT Chain
          </a>
          <a
            href={activeChain.blockExplorers.default.url}
            target="_blank"
            rel="noreferrer"
            className={LINK_CLASS}
          >
            Explorer
          </a>
          {registry ? (
            <a
              href={explorerAddress(registry)}
              target="_blank"
              rel="noreferrer"
              className={`${LINK_CLASS} font-mono text-xs`}
            >
              Registry
            </a>
          ) : null}
          <Link href="/explore" className={LINK_CLASS}>
            Explore
          </Link>
        </div>
      </div>
    </footer>
  );
};
