"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/config/navigation";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { GLASS } from "./chrome";
import { SidebarFooter } from "./SidebarFooter";

/**
 * Destinations only. The wallet lives in the header beside this rail, so this
 * holds one kind of thing and holds it at every width: a rail on large screens,
 * a tab bar along the bottom on small ones. No drawer and no open state — a
 * phone gets the destinations where a thumb already is.
 */
export const Sidebar = () => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <aside
        className={cn(
          GLASS,
          "fixed inset-y-4 left-4 z-40 hidden w-60 flex-col rounded-[8px] px-4 py-5 lg:flex",
        )}
      >
        <Link href="/explore" className="flex shrink-0 items-center gap-2">
          <Image
            src="/assets/logo.svg"
            alt=""
            width={28}
            height={28}
            priority
            className="size-7 rounded-[8px]"
          />
          <span className="text-sm font-semibold tracking-tight text-ink">
            {SITE.name}
          </span>
        </Link>

        <nav aria-label="Primary" className="mt-7 flex flex-1 flex-col gap-1">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm transition-colors duration-150 ease-out",
                isActive(item.href)
                  ? "bg-accent font-semibold text-ink-inverse"
                  : "font-medium text-ink hover:bg-surface-hover",
              )}
            >
              <item.icon
                size={18}
                weight={isActive(item.href) ? "fill" : "regular"}
                aria-hidden
              />
              {item.label}
            </Link>
          ))}
        </nav>

        <SidebarFooter />
      </aside>

      <nav
        aria-label="Primary, compact"
        className={cn(
          GLASS,
          "fixed inset-x-3 bottom-3 z-40 mb-[env(safe-area-inset-bottom)] flex items-stretch justify-around rounded-[8px] lg:hidden",
        )}
      >
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-[8px] py-2.5 text-[11px] transition-colors duration-150 ease-out",
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
