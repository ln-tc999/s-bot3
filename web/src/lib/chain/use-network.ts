"use client";

import { getNetworkConfig } from "@/config/contracts";
import { useWallet } from "@/lib/onchain/WalletProvider";

/**
 * The network this render is about: the wallet's when it is on a BOT chain,
 * otherwise the one picked in the switcher, and for a first visit the cookie
 * the server rendered this page from. Anything that puts a network's name or
 * address on screen goes through here — `activeChain` is frozen at build time,
 * so it kept naming testnet after the wallet had already moved to mainnet.
 */
export const useNetwork = () => getNetworkConfig(useWallet().selectedChainId);
