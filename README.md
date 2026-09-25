<p align="center">
  <img src="web/public/assets/logo.png" alt="s-bot3" width="72" />
</p>

<h1 align="center">s-bot3</h1>

<p align="center">
  Index funds whose composition is the public record — published on BOT Chain,
  freezable forever, safely delegable to a rebalancing agent, and settled in the
  basket itself.
</p>

---

## What this is

An index fund is two things: a set of **rules** and a set of **numbers that move**.
Nearly every product on the market blurs them together, so whoever is allowed to
adjust the numbers is usually also allowed to quietly rewrite the rules.

s-bot3 keeps them apart, and the contract is what keeps them apart — not a
promise in a document.

- **Publish an index.** Pick tokens, give each a weight, write down your
  methodology. One transaction on BOT Chain. The wallet that signs it owns it.
- **Freeze the methodology.** One more transaction and the rules can never be
  rewritten. There is no unlock function and no admin who could add one — not
  the owner, not us.
- **Delegate the rebalancing.** Hand an agent the weight key. It can set weights
  and nothing else: it cannot touch the methodology, cannot delegate, cannot take
  ownership. Revoke it and it is left with nothing.
- **Open it for subscriptions.** Attach a share token and people can subscribe by
  delivering the basket. The attachment is set once and has no second setter, so
  an index can never be pointed at a different vault after people have put money
  in.

Everything an index says about itself is readable straight from the contract.
No indexer, no subgraph, no backend, no API key.

## How settlement works

Subscribing does not pay in dollars. It delivers **the basket itself** — every
constituent, in the weights the registry publishes at that moment — and mints
shares against it. Redeeming returns a pro rata slice of what the vault actually
holds.

That asymmetry is the mechanism, not a compromise:

- subscriptions arrive at the **target** weights, so they pull the holdings
  toward whatever the agent last published
- redemptions are pro rata of **actual** holdings, so the vault can never owe
  more than it has, whatever the weights say

Two things fall out of it.

**Rebalancing means something.** When an agent changes the weights, the basket
the next subscription must deliver changes with it, and the gap between what the
vault holds and what it publishes becomes a number anyone can read — `driftBps`.
It closes as subscriptions arrive at the new weights. No DEX, no oracle, no
trading: the creation flow is the rebalancing mechanism, which is how it works
in an actual ETF.

**There is yield, and it is not printed.** A fee is charged on subscribe and on
redeem, in kind. Whatever is not paid out stays in the basket, which raises
`navPerShare` for everyone still holding — and because both sides round toward
the vault, NAV can never fall. That is the whole of it: no emissions, no external
protocol, no stated return.

The index owner sets both numbers at deployment, and both are immutable after:
`feeBps`, capped at 1%, and `ownerFeeBps`, the slice of it paid to them rather
than left to holders. The contract refuses an owner slice larger than the fee,
which is what keeps NAV monotonic — the vault can only ever pay out money it just
charged on top, never money the shares already represent. Set the slice to zero
and the whole fee is yield.

What it is **not**: a price. Each vault carries a unit price per constituent,
declared once by the index owner at deployment and immutable after. It converts
a weight, which is a share of value, into a quantity of tokens. It is not a
market price, there is no feed behind it, and only the fee moves NAV.

### What that looks like

An index of `btc` and `eth` at unit prices of 60,000 and 3,000, seeded at a NAV
of 100, with a 20 bps fee of which 5 goes to the index owner. Ten shares have
been subscribed, and the agent has just rebalanced from 60/40 to 80/20.

Subscribing for twenty more shares at that moment costs 20 × 100.15 = 2,003 of
notional, which the vault asks for as a basket:

| | delivered | of which to the owner | kept by the vault |
|---|---|---|---|
| `btc` | 0.02676009 | 0.00001335 | 0.02674674 |
| `eth` | 0.13380040 | 0.00006677 | 0.13373363 |

and twenty shares are minted. Two things move:

```
navPerShare   100.150000 -> 100.250177     the 15 bps the owner was not paid
driftBps            2000 ->        665     new money arrived at the new weights
```

Redeeming is where the drift becomes visible in a wallet. At that point minting
one share costs `0.00133935 btc + 0.00669671 eth`, while redeeming one returns
`0.00122293 btc + 0.00889108 eth` — more eth back than went in, because you mint
at the **target** weights and redeem the **actual** mix the vault still holds.
The value is what you would expect: 100.45 in, 100.05 out, the difference being
the fee charged on both sides.

## How to use it

1. Open the site and click **Connect**. If your wallet has never seen BOT Chain,
   the app offers to add it for you — you do not have to configure anything by hand.
2. Go to **Create**. Name the index, write what it tracks, pick up to sixteen
   tokens and set their weights. They have to total 100.00%, and the contract
   enforces that. Past eight the form says so, because settling in kind costs
   the subscriber one approval per constituent.
3. Press **Publish index** and sign one transaction. You now own it.
4. On the index page, press **Lock it** to freeze the methodology forever, or
   paste an address under **Rebalancer** to delegate the weight key.
5. Still on the index page, press **Enable trading** to deploy its share token.
   Declare a unit price per constituent, a seed NAV, the fee and your slice of
   it, then two signatures: one deploys, one attaches. Every one of those is
   immutable afterwards.
6. Anyone can now open **Trade** and subscribe or redeem against the index. On
   testnet the drop icon in the sidebar claims every constituent the book knows
   about, and the trade panel offers the same for whatever a particular basket
   is short of.

Every index page has a **Share** button. The card it shows is the page's own
Open Graph image, so pasting the link anywhere that unfurls links renders the
composition without anyone downloading anything — and the same image is what the
Download button saves. Nothing on it is asserted by the app; every field is read
from the contract.

You need a little BOT for gas. On testnet, take it from
[faucet.botchain.ai/basic](https://faucet.botchain.ai/basic).

### Running the agent

Delegation is the claim worth seeing exercised, so it has a script rather than
only a field in the UI:

```bash
cd web
PRIVATE_KEY=0x… pnpm agent two-majors equal      # or 8000,2000
PRIVATE_KEY=0x… pnpm agent two-majors equal --dry # print the plan, sign nothing
```

It refuses to sign as anything but the owner or the delegated agent, prints the
weights before and after, and — once a vault is attached — the drift the
rebalance just opened. What makes it safe is not the script: `setWeights` is the
only function the registry will accept an agent on, so the same key run against
`lock`, `delegate`, `setMethodology` or `setVault` is refused by the contract.

There is also `pnpm seed`, which publishes a spread of indexes so a freshly
deployed registry has something to read. It checks `exists` first, so running it
twice is harmless.

## Live

**[s-bot3.vercel.app](https://s-bot3.vercel.app)**

One deployment serves both networks. The switcher in the header moves the
wallet between them, and balances, index data and explorer links all reload
from whichever is selected.

Testnet is live. Mainnet only appears in the switcher once
`NEXT_PUBLIC_MAINNET_REGISTRY_ADDRESS` and `NEXT_PUBLIC_MAINNET_TOKENBOOK_ADDRESS`
are set, which is deliberate — an option that cannot settle anything is worse
than no option.

## Deployment

| Network | Chain ID | `SBot3Registry` | `MockERC20 (mUSDC)` |
|---|---|---|---|
| BOT Chain Testnet | `968` | `0x1955eF9145cCAa643a8Ee61aE3206F0acb632Adf` | `0x75ef70Ea33994a16751ff0b4f7DCF0F94DF1351F` |
| BOT Chain Mainnet | `677` | `0x75ef70Ea33994a16751ff0b4f7DCF0F94DF1351F` | `0x1955eF9145cCAa643a8Ee61aE3206F0acb632Adf` |

> **Note:** Mainnet addresses are the same as testnet due to deterministic CREATE opcode (same deployer, same nonce). Contracts were deployed via `forge create --evm-version paris` against `https://rpc.botchain.ai`.

An index can only name symbols the book has bound, because settlement has to be
able to resolve every one of them. On testnet these are bound:

| Symbol | Token | Decimals | Address |
|---|---|---|---|
| `btc` | mBTC | 8 | `0xe4c0c88a4b2e5b150D3bB8D3d391E6A87b3d5379` |
| `eth` | mETH | 18 | `0xC12684b7063e3C749f0227539601a7b370073cEA` |
| `sol` | mSOL | 9 | `0x0524084225073d0d1A6fCc37731bAD7B99D240C2` |
| `usdc` | mUSDC | 6 | `0x75ef70Ea33994a16751ff0b4f7DCF0F94DF1351F` |

Mainnet uses the same MockERC20 (`0x1955eF9145cCAa643a8Ee61aE3206F0acb632Adf`) for faucet + settlement. The registry reads `NEXT_PUBLIC_MAINNET_REGISTRY_ADDRESS` and `NEXT_PUBLIC_MAINNET_QUOTE_ADDRESS` from Vercel env.

Each `faucet()` claim is 1,000 whole units. The decimals are deliberately
realistic: that is what a weight is converted through, and getting one wrong
misprices every subscription without raising anything. `TokenBook.register` is
open, so anyone can bind a symbol nobody has claimed — and nobody can repoint one
that is already bound.

Deploy `SBot3Registry` and `TokenBook` once per network. Addresses are
configured per chain in
[`web/src/config/contracts.ts`](web/src/config/contracts.ts): the testnet ones
are hardcoded as defaults, and mainnet reads from the environment.

```bash
NEXT_PUBLIC_MAINNET_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_TOKENBOOK_ADDRESS=0x...
```

Constituent tokens are registered in the book — mocks on testnet, real ERC20s on
mainnet — and every index's share token is deployed from the site by whoever owns
that index, so neither is listed here.

Step by step, including the constructor arguments and how to prove the
deployment works: **[DEPLOY.md](DEPLOY.md)**.

Explorers: [scan.bohr.life](https://scan.bohr.life) (testnet) ·
[scan.botchain.ai](https://scan.botchain.ai) (mainnet)

## The contracts

[`contracts/src/SBot3Registry.sol`](contracts/src/SBot3Registry.sol) — one file,
zero dependencies, zero imports. It compiles in Remix as-is.

| Function | Who can call it | What it does |
|---|---|---|
| `create(label, name, symbols, weights, methodology)` | anyone | Publishes an index owned by the caller. Weights must total 10,000 bps, at most 16 constituents. |
| `lock(label)` | owner | Freezes the methodology. Irreversible. |
| `setMethodology(label, text)` | owner, before the lock | Rewrites the rules. |
| `delegate(label, agent)` | owner | Grants the weight key, or revokes it with the zero address. |
| `setVault(label, vault)` | owner, once | Attaches the share token, after checking it names this label. There is no second call. |
| `setWeights(label, weights)` | owner **or** agent | Rebalances. Still allowed after the lock — that is the point. |
| `getIndex(label)` | anyone | Everything about one index, in one call. |
| `weightsOf(label)` / `symbolsOf(label)` | anyone | The settlement path's reads, without the prose. |
| `allLabels()` | anyone | Every index ever published. |

Three more come with it, all equally standalone:

[`TokenBook.sol`](contracts/src/TokenBook.sol) binds a symbol to a token, once
per symbol and never again — so `btc` cannot mean two things to two indexes. The
registry stores no addresses on purpose; this is where settlement gets one.

[`IndexVault.sol`](contracts/src/IndexVault.sol) is the share token an index
settles in: it holds the real basket, mints against deliveries at the published
weights, and redeems pro rata of what it has. It has no owner and no setters —
every number it was deployed with is immutable, including the fee and where the
fee goes.

| Function | What it does |
|---|---|
| `previewSubscribe(shares)` | The basket that mints `shares`, fee included, at the weights published right now. |
| `subscribe(shares, maxAmounts)` | Delivers it and mints. `maxAmounts` bounds what a rebalance between the quote and the block can pull. |
| `previewRedeem(shares)` | A pro rata slice of the actual holdings, less the fee. Not the published weights. |
| `redeem(shares)` | Burns and pays it out. |
| `navPerShare()` | Units of account per whole share, derived from what is held. Rises with the fee, cannot fall. |
| `driftBps()` | How far the holdings sit from the published weights. |
| `weights()` | Read straight from the registry — the vault copies nothing. |
| `holdings()` / `totalNotional()` | What is actually in the basket. |
| `feeBps` / `ownerFeeBps` / `feeRecipient` | The fee, the owner's slice of it, and where that slice goes. Capped at 1%, and the slice can never exceed the fee. |

[`MockERC20.sol`](contracts/src/MockERC20.sol) is a test constituent with an open
`faucet()`, so a visitor can assemble a basket without asking anyone. Testnet
only — on mainnet the book binds real tokens instead.

### Checking it yourself

[`SBot3RegistryCheck.sol`](contracts/src/SBot3RegistryCheck.sol) and
[`IndexVaultCheck.sol`](contracts/src/IndexVaultCheck.sol) hold the assertions —
two contracts, because one carrying a registry, a book, a token and a vault at
once lands over the 24 KB deployment limit. Deploy each in Remix and call
`check()`: it returns `true`, or it reverts naming the assertion that failed.
They prove the negative cases too — that the owner is refused after locking,
that the agent is refused everywhere except `setWeights`, that a bound symbol
cannot be repointed, that a
vault naming the wrong label is refused, that an owner slice above the fee is
refused, that NAV never falls even when the owner is being paid, that a rebalance
opens drift and a subscription closes it, and that redeeming always returns less
value than minting the same shares costs.

With Foundry installed you can run the same assertions locally:

```bash
forge test --root contracts
```

## Running the site locally

```bash
cd web
pnpm install
cp .env.example .env.local     # then fill in the contract addresses
pnpm dev
```

The site ships with a **network switcher** in the header. Testnet (`968`) is
the default; no env var is needed to use it. To enable mainnet (`677`), set
the mainnet contract addresses:

```bash
NEXT_PUBLIC_MAINNET_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_QUOTE_ADDRESS=0x...
```

Once set, the switcher in the header lets users flip between testnet and
mainnet at runtime — no rebuild required.

### Against a local chain

Nothing here needs a testnet. Anvil ships with Foundry, and the whole flow —
publish, attach a vault, subscribe, rebalance, watch the drift close — runs on
it in about a minute:

```bash
anvil --chain-id 968 &
```

Deploy `SBot3Registry` and `TokenBook`, deploy a `MockERC20` per symbol and
register each one in the book, then put the two addresses plus
`NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545` in `web/.env.local`. The commands are
the same ones in [DEPLOY.md](DEPLOY.md), with `--rpc-url http://127.0.0.1:8545`
and any of anvil's funded keys.

Give the mocks realistic decimals — 8 for `btc`, 18 for `eth`. The scaling
between a weight and a quantity runs through them, and it is the one place an
in-kind vault misprices silently.

After changing a contract, regenerate what the site ships with — the ABIs and the
`IndexVault` creation bytecode the browser deploys:

```bash
forge build --root contracts && node contracts/script/gen-abi.mjs
```

## Built on

[BOT Chain](https://botchain.ai) · Next.js 16 · viem · Solidity 0.8.28 · Foundry

> **Note on deploying.** Solidity 0.8.20 and above target Shanghai by default,
> which emits the `PUSH0` opcode. If a deploy is rejected for an invalid opcode,
> set the EVM version to **paris** in Remix under Solidity Compiler → Advanced
> Configurations, and redeploy.

## License

MIT
