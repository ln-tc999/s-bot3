import { NETWORKS } from "@/config/contracts";

/**
 * Which network the app is showing when no wallet is there to say.
 *
 * A server component cannot see a wallet, so the choice has to travel as
 * something the server can read: a cookie, written whenever the switcher is
 * used or the wallet moves. `NEXT_PUBLIC_CHAIN_ID` stays as the fallback for a
 * first visit, because a cookie that does not exist yet is not an opinion.
 */
export const NETWORK_COOKIE = "sbot3.network";

const MAX_AGE = 60 * 60 * 24 * 365;

/** `Number(null)` is 0, and 0 is a chain id nobody means. */
const knownChainId = (value: number | null | undefined): number | null =>
  value != null && NETWORKS[value] ? value : null;

const readCookieValue = (header: string): string | null => {
  for (const entry of header.split(";")) {
    const [name, ...rest] = entry.trim().split("=");
    if (name === NETWORK_COOKIE) {
      return rest.join("=");
    }
  }

  return null;
};

export const parseCookieChainId = (
  header: string | null | undefined,
): number | null => {
  if (!header) {
    return null;
  }

  const raw = readCookieValue(header);
  return raw ? knownChainId(Number(raw)) : null;
};

/** The configured default, for a visitor who has never chosen. */
export const defaultChainId = (): number =>
  knownChainId(Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 968)) ?? 968;

/**
 * Remember the network so the next server render reads the same one.
 *
 * The Cookie Store API is the recommended way to do this, but it is async —
 * and this runs immediately before `router.refresh()`, which would race it and
 * render the route the visitor just left. A plain write is synchronous, and
 * this is exactly the case it exists for.
 */
export const rememberNetwork = (chainId: number): void => {
  if (typeof document === "undefined" || !NETWORKS[chainId]) {
    return;
  }

  // biome-ignore lint/suspicious/noDocumentCookie: must be synchronous here, see above
  document.cookie = `${NETWORK_COOKIE}=${chainId}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
};
