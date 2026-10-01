import { cookies } from "next/headers";
import { defaultChainId, NETWORK_COOKIE, parseChainIdValue } from "./selected";

/**
 * The network a server component should read.
 *
 * Reading the cookie makes the route dynamic — it has to, because the answer
 * differs per visitor and there is no wallet up here to ask. What that costs is
 * a cache entry; what it buys is an `/explore` that shows the network the
 * header says it is showing.
 */
export const selectedChainId = async (): Promise<number> => {
  const store = await cookies();
  return (
    parseChainIdValue(store.get(NETWORK_COOKIE)?.value) ?? defaultChainId()
  );
};
