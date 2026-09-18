# Deploying the contracts

Two contracts are deployed once per network. Every index's share token is
deployed later, from the site, by whoever owns that index — so it never appears
here.

| | What it is | Deployed by |
|---|---|---|
| `SBot3Registry` | Holds every index: composition, methodology, lock, agent, vault | you, once |
| `MockERC20` | The test dollar every vault settles in | you, once |
| `IndexVault` | One index's share token | the index owner, from the site |

Do the whole thing on **testnet 968 first**. Contracts are immutable: a bug on
mainnet means redeploying, and the address in your README, your X post and your
launch announcement is then wrong.

---

## Before you start

1. MetaMask installed, with **BOT Chain Testnet** added — chain ID `968`, RPC
   `https://rpc.bohr.life`, symbol `BOT`, explorer `https://scan.bohr.life`.
2. Some testnet BOT for gas, from [faucet.botchain.ai/basic](https://faucet.botchain.ai/basic).
3. `remix.ethereum.org` open, with `contracts/src/` copied in. The files import
   nothing outside that folder, so pasting them is enough — there is no
   dependency to install.

> **If a deploy is rejected for an invalid opcode.** Solidity 0.8.20 and above
> target Shanghai by default, which emits `PUSH0`. Set **EVM version** to
> `paris` in Remix under *Solidity Compiler → Advanced Configurations*, then
> compile and deploy again. This is not a bug in the contract.

---

## 1. Deploy the quote token

`MockERC20` is the asset deposits are paid in. Anyone can mint from it, which is
the point — a visitor has to be able to fund a wallet without asking you.

Constructor arguments, in order:

| Argument | Value | Why |
|---|---|---|
| `_name` | `Mock USD` | |
| `_symbol` | `mUSDC` | |
| `_decimals` | `6` | Must be `6`. The app's `QUOTE.decimals` is 6, and a mismatch silently misprices every deposit by a factor of a thousand or more. |
| `_faucetAmount` | `1000000000` | 1,000 whole units at 6 decimals. |

In Remix that is typed as one comma-separated line:

```
"Mock USD", "mUSDC", 6, 1000000000
```

Copy the deployed address. This is `NEXT_PUBLIC_QUOTE_ADDRESS`.

## 2. Deploy the registry

`SBot3Registry` takes **no constructor arguments**. Deploy it and copy the
address. This is `NEXT_PUBLIC_REGISTRY_ADDRESS`.

It has no owner and no admin. Nobody, including you, can pause it, upgrade it,
or unlock an index somebody froze.

## 3. Prove it works on the chain you just deployed to

Deploy `SBot3RegistryCheck` (no constructor arguments) and call `check()`.

It returns `true`, or it reverts naming the assertion that failed. It deploys
its own throwaway registry, vault and token internally, so it never touches
what you deployed in steps 1 and 2 — running it is free of side effects beyond
gas.

What it proves, including the negative cases:

- weights that do not total 10,000 bps are refused
- a symbol published twice is refused
- after `lock`, **the owner** is refused when rewriting the methodology
- there is no second `lock`, so nothing can toggle it back
- a delegated agent can `setWeights` **after** the lock
- the same agent is refused on `setMethodology` and on `setVault`
- revoking the delegation leaves the agent with nothing
- a vault cannot be replaced once attached
- deposit then immediate redeem never returns more than it took

Green here means the 35-point submission item is done.

## 4. Point the site at it

In `web/.env.local`:

```bash
NEXT_PUBLIC_CHAIN_ID=968
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...   # from step 2
NEXT_PUBLIC_QUOTE_ADDRESS=0x...      # from step 1
```

Restart the dev server. **Next does not reload env without a restart**, so a
server started before you pasted these will keep reading them as empty and the
sidebar will still say *Not deployed yet*.

## 5. Walk it end to end

In the browser, with a wallet holding testnet BOT:

1. **Create** → publish an index. One signature.
2. On the index page → **Lock it**. Confirm the methodology row now reads
   *Locked* and the button is gone.
3. **Enable trading** → two signatures: one deploys that index's `IndexVault`,
   one attaches it with `setVault`.
4. Sidebar → **Get test USDC**, then **Trade** → deposit, then redeem.
5. **Portfolio** → the position appears.

If step 3 or 4 fails, check `NEXT_PUBLIC_QUOTE_ADDRESS` first — a missing quote
token is the only thing that disables trading while everything else works.

---

## Mainnet

Identical, with two differences:

- MetaMask on **BOT Chain Mainnet**: chain ID `677`, RPC
  `https://rpc.botchain.ai`, explorer `https://scan.botchain.ai`.
- There is no faucet. Ask the organizer for a BOT allocation, or swap on
  [dex.botchain.ai](https://dex.botchain.ai/#/swap).

Set `NEXT_PUBLIC_CHAIN_ID=677` on the production host along with the mainnet
addresses. Then fill both rows of the Deployment table in
[`README.md`](README.md) — submission item #3 wants the testnet **and** mainnet
addresses, not one of them.

---

## Doing it with Foundry instead

Remix is what the hackathon guide assumes, but the repo is a Foundry project and
`forge` is less error-prone for repeat deploys:

```bash
cd contracts
export PATH="$HOME/.foundry/bin:$PATH"
export PRIVATE_KEY=0x...            # a throwaway key, never a real wallet

forge create src/MockERC20.sol:MockERC20 \
  --rpc-url https://rpc.bohr.life --private-key $PRIVATE_KEY --broadcast \
  --constructor-args "Mock USD" "mUSDC" 6 1000000000

forge create src/SBot3Registry.sol:SBot3Registry \
  --rpc-url https://rpc.bohr.life --private-key $PRIVATE_KEY --broadcast
```

Add `--evm-version paris` to either command if the chain rejects `PUSH0`.

The same assertions run locally without spending anything:

```bash
forge test --root contracts
```
