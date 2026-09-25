# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All web commands run from `web/` (pnpm, Node):

```bash
pnpm dev                  # Next dev server
pnpm build                # production build
pnpm lint                 # biome check (lint + format check + import order)
pnpm format               # biome format --write — NOTE: formats the whole tree
pnpm check:assets         # fails if a /public path referenced in src/ does not exist
pnpm check:wallet         # asserts pickWallet's precedence (announced beats injected)
pnpm contracts:build      # forge build --root ../contracts
pnpm contracts:check      # forge test --root ../contracts
```

Foundry lives outside the web project; `export PATH="$HOME/.foundry/bin:$PATH"` if `forge` is not found.

`pnpm format` rewrites every file it can, not just the ones you touched. Prefer
`pnpm exec biome check --write <path>` scoped to your own changes.
`neon-dither.tsx` fails `pnpm lint` on `main`; leave it be unless that is the
task.

The two tests in `contracts/test/SBot3Registry.t.sol` just call
`SBot3RegistryCheck.check()` and `IndexVaultCheck.check()`. Run one with
`forge test --root contracts --match-test test_VaultCheck -vvv`; to add or change
an assertion, edit the check contract — they are deliberately contracts, not
Forge tests, so the same assertions can be run from Remix on a live chain.

**Keep both under EIP-170 (24 KB).** A check carries the creation bytecode of
everything it deploys internally, so they are already split for that reason and
`IndexVaultCheck` takes its registry, book and tokens as constructor arguments.
`forge build --sizes --root contracts` is the check; `forge test` will not catch
a contract that is too large to deploy.

Contracts are deployed by hand (Remix or `forge create`), never from a script in
this repo. See DEPLOY.md.

## Architecture

Two halves, no backend between them:

- `contracts/src/` — four standalone Solidity files with **zero imports**, so they
  can be pasted into Remix as-is. `SBot3Registry.sol` (every index: composition,
  methodology, lock, agent, vault), `TokenBook.sol` (write-once symbol → token
  bindings), `IndexVault.sol` (one index's share token, holding the real basket),
  `MockERC20.sol` (a testnet constituent with an open `faucet()`). Keep them
  import-free.
- `web/` — Next 16 App Router + viem. No wagmi, no RainbowKit, no indexer, no API
  routes, no database. Every read is a `publicClient.readContract` against the
  registry (`allLabels` + `getIndex`); the contract keeping its own label list is
  why no subgraph is needed.

### The settlement model

Subscribing delivers the **basket** — each constituent in the weights the
registry publishes at that moment — and mints shares. Redeeming returns a pro
rata slice of the vault's **actual** holdings. That asymmetry is deliberate and
load-bearing:

- the vault reads weights live from the registry on every subscribe, never
  copying them into storage (a second copy is a second source of truth)
- `driftBps` is how far holdings sit from published weights; it opens when an
  agent rebalances and closes through new subscriptions, not through trading
- a fee is taken in kind on both sides; `ownerFeeBps` of it is paid to
  `feeRecipient` and the rest stays in the basket, so `navPerShare` rises and can
  never fall — that is the only yield here. The constructor refuses
  `ownerFeeBps > feeBps`, and that cap is exactly what makes NAV monotonic:
  touching either side of that split means redoing the proof.
- `unitPrices` is a fixed unit of account declared at deploy and immutable; it
  converts a weight (a share of value) into a quantity. It is not a feed.

### Data flow

`app/(main)/layout.tsx` fetches all indexes **on the server** (`revalidate = 30`)
and hands them to `PortfolioProvider`, which layers per-wallet balances and each
vault's `navPerShare` on top client-side. `WalletProvider` wraps everything.

`lib/chain/` is read-only and server-safe: `chains.ts` (the two BOT chains +
`getChain`), `client.ts` (`getPublicClient`, one memoised client per chain, plus
`readOrFallback`), `registry.ts` (`LiveIndex`, the one shape the whole UI renders
from), `tokenbook.ts` (symbol → token, plus `fetchBasketTokens`), `vault.read.ts`
(NAV, drift, holdings), `liquidity.ts` (every vault's `totalNotional`, summed for
the explore tile), `abi.ts` / `vault.ts` (generated), `unit.ts` (the 18 decimal
unit of account and the defaults the deploy form offers).

### The chain is chosen at runtime

There is a network switcher in the header, so the chain is **not** fixed at build
time. `config/contracts.ts` holds each network's `registryAddress` and
`tokenBookAddress` — testnet's are hardcoded defaults, mainnet's come from
`NEXT_PUBLIC_MAINNET_*`. Anything reading a contract takes an optional `chainId`
and passes it to `getPublicClient` / `registryAddress` / `tokenBookAddress`.

Server components render against the default chain and do not know the wallet's;
`PortfolioProvider` refetches the index list client-side whenever `chainId`
changes, which is what makes switching work. `activeChain` still exists as the
default-chain fallback. `NEXT_PUBLIC_RPC_URL` overrides the RPC for the
configured chain only, so pointing a local run at anvil does not redirect the
other network to it too.

`lib/onchain/` is all writes and all wallet state, every file `"use client"`:
`provider.ts` is a hand-rolled EIP-6963 discovery + BOT Chain add/switch, and
`pickWallet` there decides which wallet acts: a remembered choice, else the sole
announcer, else nothing — `window.ethereum` is the last resort, never a
preference, because it is only whichever extension won the injection race,
`WalletProvider.tsx` owns the connection, and hooks (`useCreateIndex`,
`useVaultActions`) do write → `waitForTransactionReceipt` → `refresh()`.
`refresh()` bumps `epoch`, and `epoch` is what every balance effect depends on —
that is the only refetch mechanism; there is no query cache.

### Route ↔ component convention

`app/(main)/<route>/page.tsx` is a thin wrapper: metadata, `await params` /
`await searchParams`, then render `components/pages/<name>/index.tsx`, which holds
the real page (often an async server component doing its own `fetchIndexes()`).
Its private parts live in `components/pages/<name>/components/`. Shared primitives
are in `components/ui/`.

`/indexes/[slug]` is the record — weights, methodology, lock, agent.
`/trade/[slug]` is settlement — subscribe/redeem, NAV, drift. They link to each
other rather than merging.

Pages stay server components; `"use client"` sits on the leaves that need a wallet
or interaction.

## Things that bite

- **`lib/chain/abi.ts` and `lib/chain/vault.ts` are generated.** After touching a
  contract, run `forge build --root contracts && node contracts/script/gen-abi.mjs`.
  `vault.ts` embeds `indexVaultBytecode`, which `ShareTokenCard.tsx` deploys
  straight from the browser — stale bytecode ships a stale vault with no error.
- **Deleting a route leaves stale types.** Next's generated
  `.next/dev/types/validator.ts` still imports the removed page and fails
  `next build`; `rm -rf .next tsconfig.tsbuildinfo` clears it.
- **Env is inlined at build time.** `NEXT_PUBLIC_*` changes need a dev server
  restart, or the sidebar keeps reporting "Not deployed yet".
- **Decimals are asymmetric.** Shares and the unit of account are both 18
  (`SHARE_DECIMALS`, `UNIT_DECIMALS`), but each constituent has its own, read
  from the token and stored as the vault's scale. That scaling is where an
  in-kind vault misprices silently.
- **Weights are basis points, must total exactly 10,000, and at most 16
  constituents** (`MAX_CONSTITUENTS`) — all enforced onchain, so the create form
  must enforce them too or the transaction reverts.
- **BOT Chain has no Multicall3.** `publicClient.multicall` throws; batch reads go
  through `Promise.all` + `readOrFallback` instead.
- **`getIndex` reverts `UnknownIndex` for an unpublished label** — that is a 404,
  not an error; `fetchIndex` returns null and stays quiet. `TokenBook.addressOf`
  reverts `UnknownSymbol` the same way, which is what makes an index readable but
  not settleable.
- **`faucet()` is a MockERC20 affordance.** Anything calling it must be gated on
  `activeChain.testnet`; on mainnet the book binds real tokens that have none.
- Deploys may be rejected for `PUSH0`; compile with EVM version **paris**.
- Colors come from the `@theme` tokens in `globals.css` (`ink`, `surface`, `line`,
  `accent`…). `--color-brand` #10A37F is only 3.20:1 on white — use `accent-ink`
  for small text on light, never `brand`.
