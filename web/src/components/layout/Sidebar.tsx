"use client";

import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/config/navigation";
import { SITE } from "@/config/site";
import { explorerAddress } from "@/lib/chain/chains";
import { registryAddress } from "@/lib/chain/registry";
import { cn } from "@/lib/cn";

export const Sidebar = () => {
  const pathname = usePathname();
  const registry = registryAddress();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Floating Vertical Icon Dock (Desktop) */}
      <aside
        className={cn(
          "fixed top-1/2 left-5 z-40 hidden -translate-y-1/2 flex-col items-center gap-5 rounded-3xl border border-line-strong/60 bg-surface/95 p-3 shadow-glass backdrop-blur-2xl lg:flex",
        )}
      >
        {/* App Logo */}
        <Link
          href="/explore"
          title={SITE.name}
          className="flex size-11 items-center justify-center rounded-2xl bg-surface-subtle p-2 transition-transform duration-150 ease-out hover:scale-105"
        >
          <Image
            src="/assets/logo.svg"
            alt={SITE.name}
            width={26}
            height={26}
            priority
            className="size-6 rounded-md"
          />
          <span className="sr-only">{SITE.name}</span>
        </Link>

        {/* Primary Navigation Icons */}
        <nav
          aria-label="Primary Dock"
          className="flex flex-col items-center gap-2"
        >
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-2xl transition-all duration-150 ease-out",
                  active
                    ? "bg-accent text-ink-inverse shadow-raised"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                )}
              >
                <item.icon
                  size={20}
                  weight={active ? "fill" : "regular"}
                  aria-hidden
                />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px w-7 bg-line" aria-hidden />

        {/* Registry link */}
        <div className="flex flex-col items-center gap-2">
          {/* Router / Explorer Icon Button */}
          {registry ? (
            <a
              href={explorerAddress(registry)}
              target="_blank"
              rel="noreferrer"
              title="View Registry on BOTScan Explorer"
              className="flex size-11 items-center justify-center rounded-2xl text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-ink"
            >
              <ArrowSquareOutIcon size={20} aria-hidden />
              <span className="sr-only">View Registry on Explorer</span>
            </a>
          ) : null}
        </div>
      </aside>

      {/* Mobile Compact Navigation Bar */}
      <nav
        aria-label="Primary, compact"
        className={cn(
          "fixed inset-x-3 bottom-3 z-40 mb-[env(safe-area-inset-bottom)] flex items-stretch justify-around rounded-2xl border border-line-strong/60 bg-surface/90 p-1.5 shadow-glass backdrop-blur-2xl lg:hidden",
        )}
      >
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition-colors duration-150 ease-out",
              isActive(item.href)
                ? "font-semibold text-accent-ink"
                : "font-medium text-ink",
            )}
          >
            <item.icon
              size={20}
              weight={isActive(item.href) ? "fill" : "regular"}
              aria-hidden
            />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
};
