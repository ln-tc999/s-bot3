<p align="center">
  <img src="web/public/assets/logo.svg" alt="s-bot3" width="72" />
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

## How to use it

1. Open the site and click **Connect**. If your wallet has never seen BOT Chain,
   the app offers to add it for you — you do not have to configure anything by hand.
2. Go to **Create**. Name the index, write what it tracks, pick up to sixteen
   tokens and set their weights. Past eight the form says so — settling in kind
   costs the subscriber one approval per constituent. They have to total 100.00%, and the contract
   enforces that.
3. Press **Publish index** and sign one transaction. You now own it.
4. On the index page, press **Lock it** to freeze the methodology forever, or
   paste an address under **Rebalancer** to delegate the weight key.
5. Still on the index page, press **Enable trading** to deploy its share token.
   Declare a unit price per constituent, a seed NAV, the fee and your slice of
   it, then two signatures: one deploys, one attaches. Every one of those is
   immutable afterwards.
6. Anyone can now open **Trade**, claim the test tokens they are short of, and
   subscribe or redeem against the index.

You need a little BOT for gas. On testnet, take it from
[faucet.botchain.ai/basic](https://faucet.botchain.ai/basic).

## Deployment

| Network | Chain ID | `SBot3Registry` | `TokenBook` |
|---|---|---|---|
| BOT Chain Testnet | `968` | `<TESTNET_REGISTRY>` | `<TESTNET_TOKENBOOK>` |
| BOT Chain Mainnet | `677` | `<MAINNET_REGISTRY>` | `<MAINNET_TOKENBOOK>` |

Deploy `SBot3Registry` and `TokenBook` once each, then paste both into
`web/.env.local`. Constituent tokens are registered in the book — mocks on
testnet, real ERC20s on mainnet — and every index's share token is deployed from
the site by whoever owns that index, so neither is listed here.

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
weights, and redeems pro rata of what it has.

[`MockERC20.sol`](contracts/src/MockERC20.sol) is a test constituent with an open
`faucet()`, so a visitor can assemble a basket without asking anyone. Testnet
only — on mainnet the book binds real tokens instead.

### Checking it yourself

[`SBot3RegistryCheck.sol`](contracts/src/SBot3RegistryCheck.sol) and
[`IndexVaultCheck.sol`](contracts/src/IndexVaultCheck.sol) hold the assertions —
two contracts, because one carrying a registry, a book, a token and a vault at
once lands over the 24 KB deployment limit. Deploy each in Remix and call
`check()`: it returns `true`, or it reverts naming the assertion that failed.
They prove the negative cases too — that the owner is refused after locking, that the agent is refused
everywhere except `setWeights`, that a bound symbol cannot be repointed, that a
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
cp .env.example .env.local     # then fill in the two addresses
pnpm dev
```

Set `NEXT_PUBLIC_CHAIN_ID=677` to point a deployment at mainnet; unset it and it
talks to testnet.

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
