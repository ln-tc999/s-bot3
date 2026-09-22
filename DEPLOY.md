# Deploying the contracts

Three contracts are deployed once per network. Every index's share token is
deployed later, from the site, by whoever owns that index — so it never appears
here.

| | What it is | Deployed by |
|---|---|---|
| `SBot3Registry` | Holds every index: composition, methodology, lock, agent, vault | you, once |
| `TokenBook` | The symbol to token bindings every vault settles against | you, once |
| `MockERC20` | A test constituent. Testnet only — on mainnet you bind real tokens | you, one per symbol |
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

## 1. Deploy the registry

`SBot3Registry` takes **no constructor arguments**. Deploy it and copy the
address. This is `NEXT_PUBLIC_REGISTRY_ADDRESS`.

It has no owner and no admin. Nobody, including you, can pause it, upgrade it,
or unlock an index somebody froze.

## 2. Deploy the token book

`TokenBook` also takes **no constructor arguments**. Copy the address into
`NEXT_PUBLIC_TOKENBOOK_ADDRESS`.

It answers one question — which token does `btc` mean — and it answers it once.
`register` is open to anyone for a symbol nobody has claimed, and refuses every
symbol already bound, so two indexes can never settle `btc` against two
different tokens.

The registry deliberately stores no addresses: an index publishes a symbol and a
weight, and an address in there would be the registry asserting something the
record does not say. Settlement needs one anyway, so it lives in its own book.

## 3. Bind the constituents

**On testnet**, deploy a `MockERC20` per symbol you want tradeable and register
it. Anyone can mint from a mock, which is the point — a visitor has to be able
to assemble a basket without asking you.

Constructor arguments are `(_name, _symbol, _decimals, _faucetAmount)`. Use
realistic decimals: it is what a weight is converted through, and getting it
wrong misprices every subscription silently.

```
"Mock Bitcoin", "mBTC", 8, 100000000
"Mock Ether",   "mETH", 18, 1000000000000000000
```

Then call `TokenBook.register("btc", <address>)` for each.

With Foundry the whole loop is one paste:

```bash
cd contracts
export PATH="$HOME/.foundry/bin:$PATH"
export PRIVATE_KEY=0x...            # a throwaway key, never a real wallet
export RPC=https://rpc.bohr.life
export BOOK=0x...                   # from step 2

deploy_token () {   # name symbol decimals faucet symbolKey
  ADDR=$(forge create src/MockERC20.sol:MockERC20 \
    --rpc-url $RPC --private-key $PRIVATE_KEY --broadcast \
    --constructor-args "$1" "$2" "$3" "$4" \
    | awk '/Deployed to:/ {print $3}')
  cast send $BOOK "register(string,address)" "$5" $ADDR \
    --rpc-url $RPC --private-key $PRIVATE_KEY
  echo "$5 -> $ADDR"
}

deploy_token "Mock Bitcoin" mBTC 8  100000000            btc
deploy_token "Mock Ether"   mETH 18 1000000000000000000  eth
```

**On mainnet**, skip `MockERC20` entirely. Register the real token addresses
instead — `TokenBook.register("weth", 0x…)` — and everything downstream works
unchanged. A vault never knows or cares whether the token it pulls is a mock.

## 4. Prove it works on the chain you just deployed to

There are **two** checks, because a contract carries the creation bytecode of
everything it deploys internally and one contract carrying a registry, a book, a
token and a vault at once lands over the 24 KB limit. Both return `true`, or
revert naming the assertion that failed.

**`SBot3RegistryCheck`** — no constructor arguments. Deploy it, call `check()`.
It builds its own throwaway registry internally, so it touches nothing you
deployed above.

**`IndexVaultCheck`** — takes `(registry, book, btc, eth)`. Deploy **a second,
throwaway `SBot3Registry`** and pass that one: `check()` publishes a scratch
index called `vault-check`, and nothing can unpublish it, so you do not want it
in the registry your site reads. The book and the two mocks can be the real ones
— it only reads bindings and mints, which anyone can already do.

What the two prove between them, including the negative cases:

- weights that do not total 10,000 bps are refused
- a symbol published twice is refused, and so is a seventeenth constituent
- after `lock`, **the owner** is refused when rewriting the methodology
- there is no second `lock`, so nothing can toggle it back
- a delegated agent can `setWeights` **after** the lock
- the same agent is refused on `setMethodology` and on `setVault`
- revoking the delegation leaves the agent with nothing
- a symbol already bound in the book cannot be repointed
- `setVault` refuses an address that cannot name the label it settles, and one
  that names a different label
- a vault cannot be replaced once attached
- an owner fee larger than the fee itself is refused, and so is one with no
  recipient to pay
- a subscription's fee raises `navPerShare`, and a redemption never lowers it,
  even with the owner's slice being paid out
- an agent's rebalance opens drift, and the next subscription closes some of it
- redeeming returns strictly less value than minting the same shares costs

With Foundry both run locally without spending anything, and the test wires up
the second one's dependencies for you:

```bash
forge test --root contracts
```

## 5. Point the site at it

In `web/.env.local`:

```bash
NEXT_PUBLIC_CHAIN_ID=968
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...   # from step 1
NEXT_PUBLIC_TOKENBOOK_ADDRESS=0x...  # from step 2
```

Restart the dev server. **Next does not reload env without a restart**, so a
server started before you pasted these will keep reading them as empty and the
sidebar will still say *Not deployed yet*.

## 6. Walk it end to end

In the browser, with a wallet holding testnet BOT:

1. **Create** → publish an index, using only symbols you bound in step 3. One
   signature on BOT Chain.
2. On the index page → **Lock it**. Confirm the methodology row now reads
   *Locked* and the button is gone.
3. **Enable trading** → declare a unit price per constituent, a seed NAV, the
   fee and your slice of it, then two signatures: one deploys that index's
   `IndexVault`, one attaches it with `setVault`.
4. **Trade** → open the index, enter a share count, press *Get test tokens* for
   anything you are short of, then **Subscribe**. Then **Redeem** part of it.
5. **Portfolio** → the position appears, valued at the vault's own NAV.
6. Delegate an agent, have it call `setWeights`, and watch **drift** open on the
   trade page. Subscribe again and watch it close.

If step 3 or 4 fails, check `NEXT_PUBLIC_TOKENBOOK_ADDRESS` first — an index
whose symbols are not all bound is readable but not settleable, which is exactly
what the trade page will tell you.

> **Note on naming.** Every index on BOT Chain is identified by its `label` —
> a short, unique string written onchain at creation. There is no ENS involved;
> the label is the native identifier and can be read directly from the registry.

---

## Mainnet

Identical, with three differences:

- MetaMask on **BOT Chain Mainnet**: chain ID `677`, RPC
  `https://rpc.botchain.ai`, explorer `https://scan.botchain.ai`.
- **No `MockERC20`.** Register real token addresses in `TokenBook` instead.
  Nothing else changes: the vault pulls whatever ERC20 the book names.
- There is no faucet, and the site hides the *Get test tokens* button off
  testnet. Take BOT from the organizer, or swap on
  [dex.botchain.ai](https://dex.botchain.ai/#/swap).

Set `NEXT_PUBLIC_CHAIN_ID=677` on the production host along with the mainnet
addresses. Then fill both rows of the Deployment table in
[`README.md`](README.md) — submission item #3 wants the testnet **and** mainnet
addresses, not one of them.

### What is not mainnet ready

The unit prices a vault is deployed with are declared by the index owner and
immutable. That is honest on testnet and it is what keeps the vault solvent, but
it means a mainnet vault's NAV does not track what its constituents actually
trade for — only the fee moves it. Routing idle holdings to a real yield venue,
or marking the basket to a feed, is a different vault contract, chosen at
deployment. It is deliberately not a setter on this one: a vault whose prices an
admin could change is a vault with an admin, which is the thing this whole
protocol is arguing against.

---

## Doing it with Foundry instead

Remix is what the hackathon guide assumes, but the repo is a Foundry project and
`forge` is less error-prone for repeat deploys:

```bash
cd contracts
export PATH="$HOME/.foundry/bin:$PATH"
export PRIVATE_KEY=0x...            # a throwaway key, never a real wallet

forge create src/SBot3Registry.sol:SBot3Registry \
  --rpc-url https://rpc.bohr.life --private-key $PRIVATE_KEY --broadcast

forge create src/TokenBook.sol:TokenBook \
  --rpc-url https://rpc.bohr.life --private-key $PRIVATE_KEY --broadcast
```

Add `--evm-version paris` to either command if the chain rejects `PUSH0`.

After changing any contract, regenerate what the site ships with:

```bash
forge build --root contracts
node contracts/script/gen-abi.mjs
```

The second command rewrites `web/src/lib/chain/abi.ts` and `vault.ts`, including
the `IndexVault` creation bytecode the browser deploys. Skipping it ships a site
that deploys the old vault.
