<p align="center">
  <img src="web/public/assets/logo.svg" alt="s-bot3" width="72" />
</p>

<h1 align="center">s-bot3</h1>

<p align="center">
  Index funds whose composition is the public record — published on BOT Chain,
  freezable forever, and safely delegable to a rebalancing agent.
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
- **Open it for deposits.** Attach a share token and people can deposit into the
  index. The attachment is set once and has no second setter, so an index can
  never be pointed at a different vault after people have put money in.

Everything an index says about itself is readable straight from the contract.
No indexer, no subgraph, no backend, no API key.

## How to use it

1. Open the site and click **Connect**. If your wallet has never seen BOT Chain,
   the app offers to add it for you — you do not have to configure anything by hand.
2. Go to **Create**. Name the index, write what it tracks, pick tokens and set
   their weights. They have to total 100.00%, and the contract enforces that.
3. Press **Publish index** and sign one transaction. You now own it.
4. On the index page, press **Lock it** to freeze the methodology forever, or
   paste an address under **Rebalancer** to delegate the weight key.
5. Still on the index page, press **Enable trading** to deploy its share token.
   Two signatures: one deploys, one attaches.
6. Anyone can now open **Trade**, mint test USDC from the drop icon in the
   navbar, and deposit or redeem against the index.

You need a little BOT for gas. On testnet, take it from
[faucet.botchain.ai/basic](https://faucet.botchain.ai/basic).

## Deployment

| Network | Chain ID | `SBot3Registry` | `MockERC20` (mUSDC) |
|---|---|---|---|
| BOT Chain Testnet | `968` | `0x1955eF9145cCAa643a8Ee61aE3206F0acb632Adf` | `0x75ef70Ea33994a16751ff0b4f7DCF0F94DF1351F` |
| BOT Chain Mainnet | `677` | `<MAINNET_REGISTRY>` | `<MAINNET_QUOTE>` |

Deploy `SBot3Registry` and `MockERC20` once each, then paste both into
`web/.env.local`. Every index's share token is deployed from the site by
whoever owns that index, so it never needs to be listed here.

Step by step, including the constructor arguments and how to prove the
deployment works: **[DEPLOY.md](DEPLOY.md)**.

Explorers: [scan.bohr.life](https://scan.bohr.life) (testnet) ·
[scan.botchain.ai](https://scan.botchain.ai) (mainnet)

## The contract

[`contracts/src/SBot3Registry.sol`](contracts/src/SBot3Registry.sol) — one file,
zero dependencies, zero imports. It compiles in Remix as-is.

Two more come with it, both equally standalone:
[`IndexVault.sol`](contracts/src/IndexVault.sol) is the share token an index
settles in — a fixed price, so it is solvent by construction and can only ever
owe back what a depositor put in — and
[`MockERC20.sol`](contracts/src/MockERC20.sol) is the test dollar it settles in,
with an open `faucet()` so a visitor can fund a wallet without asking anyone.

| Function | Who can call it | What it does |
|---|---|---|
| `create(label, name, symbols, weights, methodology)` | anyone | Publishes an index owned by the caller. Weights must total 10,000 bps. |
| `lock(label)` | owner | Freezes the methodology. Irreversible. |
| `setMethodology(label, text)` | owner, before the lock | Rewrites the rules. |
| `delegate(label, agent)` | owner | Grants the weight key, or revokes it with the zero address. |
| `setVault(label, vault)` | owner, once | Attaches the share token. There is no second call. |
| `setWeights(label, weights)` | owner **or** agent | Rebalances. Still allowed after the lock — that is the point. |
| `getIndex(label)` | anyone | Everything about one index, in one call. |
| `allLabels()` | anyone | Every index ever published. |

### Checking it yourself

[`contracts/src/SBot3RegistryCheck.sol`](contracts/src/SBot3RegistryCheck.sol)
holds the assertions. Deploy it in Remix and call `check()`: it returns `true`,
or it reverts naming the assertion that failed. It proves the negative cases
too — that the owner is refused after locking, that the agent is refused
everywhere except `setWeights`, that weights totalling 9,999 bps are rejected,
that revoking leaves the agent with nothing, that a vault cannot be swapped once
attached, and that a deposit followed by an immediate redeem never hands back
more than it took.

With Foundry installed you can run the same assertions locally:

```bash
forge test --root contracts
```

## Running the site locally

```bash
cd web
pnpm install
cp .env.example .env.local     # then fill in NEXT_PUBLIC_REGISTRY_ADDRESS
pnpm dev
```

Set `NEXT_PUBLIC_CHAIN_ID=677` to point a deployment at mainnet; unset it and it
talks to testnet.

## Built on

[BOT Chain](https://botchain.ai) · Next.js 16 · viem · Solidity 0.8.20 · Foundry

> **Note on deploying.** Solidity 0.8.20 and above target Shanghai by default,
> which emits the `PUSH0` opcode. If a deploy is rejected for an invalid opcode,
> set the EVM version to **paris** in Remix under Solidity Compiler → Advanced
> Configurations, and redeploy.

## License

MIT
