"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type Account,
  type Chain,
  createWalletClient,
  custom,
  type Transport,
  type WalletClient,
} from "viem";
import { getChain, isBotChainId } from "@/lib/chain/chains";
import {
  discoverWallets,
  type Eip1193Provider,
  getInjectedProvider,
  requestBotChain,
  type WalletInfo,
} from "./provider";

interface WalletContextValue {
  address: `0x${string}` | null;
  chainId: number | null;
  isBotChain: boolean;
  isConnecting: boolean;
  hasProvider: boolean;
  error: string | null;
  /** Every wallet that announced itself, for the picker. Empty on legacy-only setups. */
  wallets: WalletInfo[];
  /** Bumped after every write so balance hooks know to read again. */
  epoch: number;
  connect: (rdns?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (targetChainId?: number) => Promise<void>;
  refresh: () => void;
  getWalletClient: () => WalletClient<Transport, Chain, Account>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Wallet request failed";

/**
 * EIP-1193 has no disconnect. A wallet the user approved keeps answering
 * `eth_accounts` forever, so "disconnected" has to be remembered here or the
 * next page load silently reconnects them.
 */
const DISCONNECTED_KEY = "sbot3.wallet.disconnected";
/** Which announced wallet was chosen last, so the picker is asked once, not every visit. */
const WALLET_KEY = "sbot3.wallet.rdns";

const readStored = (key: string): string | null => {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string | null) => {
  try {
    if (value === null) {
      globalThis.localStorage?.removeItem(key);
    } else {
      globalThis.localStorage?.setItem(key, value);
    }
  } catch {
    return;
  }
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [activeRdns, setActiveRdns] = useState<string | null>(null);

  /** Providers are not state: they are objects with identity, keyed by rdns. */
  const announced = useRef(new Map<string, Eip1193Provider>());
  const [hasLegacy, setHasLegacy] = useState(false);

  const refresh = useCallback(() => setEpoch((value) => value + 1), []);

  /**
   * The provider every call goes through: the chosen announced wallet, or the
   * legacy injected one when nothing announced. Read through a callback rather
   * than held in state so it cannot go stale between a render and a click.
   */
  const getProvider = useCallback((): Eip1193Provider | undefined => {
    if (activeRdns) {
      const provider = announced.current.get(activeRdns);
      if (provider) {
        return provider;
      }
    }
    return getInjectedProvider();
  }, [activeRdns]);

  const readChainId = useCallback(async (provider: Eip1193Provider) => {
    const hex = (await provider.request({ method: "eth_chainId" })) as string;
    setChainId(Number.parseInt(hex, 16));
  }, []);

  /** Discovery runs once and keeps listening; wallets can answer late. */
  useEffect(() => {
    setHasLegacy(getInjectedProvider() !== undefined);

    return discoverWallets(({ info, provider }) => {
      announced.current.set(info.rdns, provider);
      setWallets((current) =>
        current.some((entry) => entry.rdns === info.rdns)
          ? current
          : [...current, info],
      );
    });
  }, []);

  /** Restore the wallet chosen last time, once it has announced itself. */
  useEffect(() => {
    if (activeRdns) {
      return;
    }
    const remembered = readStored(WALLET_KEY);
    if (remembered && wallets.some((entry) => entry.rdns === remembered)) {
      setActiveRdns(remembered);
    }
  }, [activeRdns, wallets]);

  /**
   * `eth_accounts` never prompts, so a wallet the user already approved is
   * restored on load while a first time visitor sees no popup.
   */
  useEffect(() => {
    const provider = getProvider();
    if (!provider) {
      return;
    }

    const syncAccounts = (accounts: readonly string[]) => {
      setAddress((accounts[0] as `0x${string}`) ?? null);
    };

    if (readStored(DISCONNECTED_KEY) !== "1") {
      provider
        .request({ method: "eth_accounts" })
        .then((accounts) => syncAccounts(accounts as string[]))
        .catch(() => undefined);
    }
    readChainId(provider).catch(() => undefined);

    const onAccountsChanged = (accounts: never) => {
      syncAccounts(accounts as readonly string[]);
      refresh();
    };
    const onChainChanged = (hex: never) => {
      setChainId(Number.parseInt(hex as string, 16));
      refresh();
    };

    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [getProvider, readChainId, refresh]);

  const connect = useCallback(
    async (rdns?: string) => {
      const chosen = rdns ?? activeRdns ?? readStored(WALLET_KEY) ?? undefined;
      const provider = chosen
        ? (announced.current.get(chosen) ?? getInjectedProvider())
        : getProvider();

      if (!provider) {
        setError("No wallet found. Install a browser wallet to continue.");
        return;
      }

      setIsConnecting(true);
      setError(null);
      writeStored(DISCONNECTED_KEY, null);

      try {
        const accounts = (await provider.request({
          method: "eth_requestAccounts",
        })) as string[];

        /** Only remember a wallet that actually let us in. */
        if (chosen) {
          setActiveRdns(chosen);
          writeStored(WALLET_KEY, chosen);
        }

        setAddress((accounts[0] as `0x${string}`) ?? null);
        await readChainId(provider);
      } catch (cause) {
        setError(toMessage(cause));
      } finally {
        setIsConnecting(false);
      }
    },
    [activeRdns, getProvider, readChainId],
  );

  /**
   * Revoking the permission is best effort: only some wallets implement it, and
   * the ones that do will prompt again on the next connect, which is what
   * "disconnect" should mean. The local opt out is what actually holds.
   */
  const disconnect = useCallback(async () => {
    const provider = getProvider();

    writeStored(DISCONNECTED_KEY, "1");
    writeStored(WALLET_KEY, null);
    setActiveRdns(null);
    setAddress(null);
    setError(null);
    refresh();

    await provider
      ?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      })
      .catch(() => undefined);
  }, [getProvider, refresh]);

  const switchNetwork = useCallback(
    async (targetChainId: number = 968) => {
      const provider = getProvider();
      if (!provider) {
        return;
      }

      setError(null);

      try {
        await requestBotChain(provider, targetChainId);
        await readChainId(provider);
      } catch (cause) {
        setError(toMessage(cause));
      }
    },
    [getProvider, readChainId],
  );

  const getWalletClient = useCallback(() => {
    const provider = getProvider();

    if (!provider) {
      throw new Error("No wallet found.");
    }

    if (!address) {
      throw new Error("Connect a wallet first.");
    }

    return createWalletClient({
      account: address,
      chain: getChain(chainId),
      transport: custom(provider),
    });
  }, [address, chainId, getProvider]);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      chainId,
      isBotChain: isBotChainId(chainId),
      isConnecting,
      hasProvider: hasLegacy || wallets.length > 0,
      error,
      wallets,
      epoch,
      connect,
      disconnect,
      switchNetwork,
      refresh,
      getWalletClient,
    }),
    [
      address,
      chainId,
      isConnecting,
      hasLegacy,
      wallets,
      error,
      epoch,
      connect,
      disconnect,
      switchNetwork,
      refresh,
      getWalletClient,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextValue => {
  const value = useContext(WalletContext);

  if (!value) {
    throw new Error("useWallet must be used inside a WalletProvider");
  }

  return value;
};
