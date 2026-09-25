/**
 * Publishes a spread of indexes, so a fresh registry has something to read.
 *
 *   pnpm seed          # publish whatever is missing
 *   pnpm seed --dry    # list the plan, sign nothing
 *
 * Idempotent: it checks `exists(label)` first, so re-running after a partial run
 * picks up where it stopped instead of reverting on `LabelTaken`.
 *
 * Every symbol here has to be bound in the TokenBook or the index will publish
 * and then never be subscribable, because the basket cannot be assembled.
 */
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sbot3RegistryAbi } from "../src/lib/chain/abi";
import { botMainnet, botTestnet } from "../src/lib/chain/chains";

const TOTAL_BPS = 10_000;

interface Seed {
  label: string;
  name: string;
  methodology: string;
  weights: Record<string, number>;
}

const SEEDS: Seed[] = [
  {
    label: "two-majors",
    name: "Two Majors 60/40",
    methodology:
      "The two largest assets by market capitalisation, held 60/40 and reviewed quarterly.",
    weights: { btc: 6000, eth: 4000 },
  },
  {
    label: "equal-four",
    name: "Equal Four",
    methodology:
      "Every eligible asset at the same weight. No judgement about which is better, only about which is eligible.",
    weights: { btc: 2500, eth: 2500, sol: 2500, usdc: 2500 },
  },
  {
    label: "btc-weighted",
    name: "Bitcoin Weighted",
    methodology: "Bitcoin as the anchor, with ether as the single satellite.",
    weights: { btc: 8000, eth: 2000 },
  },
  {
    label: "eth-weighted",
    name: "Ether Weighted",
    methodology:
      "Ether as the anchor, on the view that settlement layers accrue more than stores of value.",
    weights: { eth: 8000, btc: 2000 },
  },
  {
    label: "smart-contracts",
    name: "Smart Contract Platforms",
    methodology:
      "Chains that execute programs, weighted toward the one with the longest record.",
    weights: { eth: 6000, sol: 4000 },
  },
  {
    label: "defensive",
    name: "Defensive Tilt",
    methodology:
      "Half in the unit of account, the rest split toward the majors. For holders who want exposure without the full swing.",
    weights: { usdc: 5000, btc: 3000, eth: 2000 },
  },
  {
    label: "risk-on",
    name: "Risk On",
    methodology:
      "No stable allocation at all. Three volatile assets, weighted by liquidity.",
    weights: { btc: 4000, eth: 3500, sol: 2500 },
  },
  {
    label: "sol-focus",
    name: "Solana Focus",
    methodology:
      "A concentrated bet on one execution environment, with the majors as ballast.",
    weights: { sol: 7000, eth: 2000, btc: 1000 },
  },
  {
    label: "cap-weighted",
    name: "Cap Weighted Three",
    methodology:
      "Weights in proportion to market capitalisation, which concentrates deliberately rather than by accident.",
    weights: { btc: 7000, eth: 2500, sol: 500 },
  },
  {
    label: "barbell",
    name: "Barbell",
    methodology:
      "Half in the most volatile asset, half in the least. Nothing in between, on purpose.",
    weights: { btc: 5000, usdc: 5000 },
  },
  {
    label: "thirds",
    name: "Thirds",
    methodology:
      "Three ways, as evenly as basis points allow. The remainder goes to bitcoin.",
    weights: { btc: 3334, eth: 3333, sol: 3333 },
  },
  {
    label: "low-vol",
    name: "Low Volatility",
    methodology:
      "Majority in the unit of account. A parking place that still tracks something.",
    weights: { usdc: 7000, btc: 2000, eth: 1000 },
  },
  {
    label: "alt-lean",
    name: "Alt Lean",
    methodology: "Away from bitcoin and toward the chains that run code.",
    weights: { eth: 4500, sol: 4500, btc: 1000 },
  },
  {
    label: "core-satellite",
    name: "Core Satellite",
    methodology:
      "A bitcoin core with three small satellites, each capped at 20% of the core.",
    weights: { btc: 6000, eth: 2000, sol: 1000, usdc: 1000 },
  },
  {
    label: "all-weather",
    name: "All Weather",
    methodology:
      "Volatile and stable in equal halves, each half split two ways.",
    weights: { btc: 3000, eth: 3000, sol: 2000, usdc: 2000 },
  },
];

const die = (message: string): never => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

/** The contract refuses anything else, so catch it here rather than in a revert. */
for (const seed of SEEDS) {
  const total = Object.values(seed.weights).reduce((sum, bps) => sum + bps, 0);
  if (total !== TOTAL_BPS) {
    die(`"${seed.label}" totals ${total} bps, not ${TOTAL_BPS}`);
  }
}

const isDry = process.argv.includes("--dry");

const chain =
  Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 968) === 677
    ? botMainnet
    : botTestnet;

const registry = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as
  | `0x${string}`
  | undefined;

if (!registry) {
  die("NEXT_PUBLIC_REGISTRY_ADDRESS is not set");
}

const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

const main = async () => {
  console.log(`${SEEDS.length} indexes for ${registry} on ${chain.name}\n`);

  const missing: Seed[] = [];

  for (const seed of SEEDS) {
    const taken = await publicClient.readContract({
      address: registry,
      abi: sbot3RegistryAbi,
      functionName: "exists",
      args: [seed.label],
    });

    const symbols = Object.keys(seed.weights);
    const shape = symbols
      .map((symbol) => `${symbol} ${(seed.weights[symbol] / 100).toFixed(0)}%`)
      .join(", ");

    console.log(`  ${taken ? "·" : "+"} ${seed.label.padEnd(16)} ${shape}`);
    if (!taken) {
      missing.push(seed);
    }
  }

  if (missing.length === 0) {
    console.log("\nAll present. Nothing to publish.");
    return;
  }

  if (isDry) {
    console.log(
      `\n--dry: ${missing.length} would be published, nothing signed.`,
    );
    return;
  }

  const key = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  if (!key) {
    die("set PRIVATE_KEY to publish");
  }

  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({
    account,
    chain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL),
  });

  console.log(`\npublishing ${missing.length} as ${account.address}`);

  for (const seed of missing) {
    const symbols = Object.keys(seed.weights);
    const hash = await wallet.writeContract({
      address: registry,
      abi: sbot3RegistryAbi,
      functionName: "create",
      args: [
        seed.label,
        seed.name,
        symbols,
        symbols.map((symbol) => seed.weights[symbol]),
        seed.methodology,
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✓ ${seed.label}`);
  }

  const total = await publicClient.readContract({
    address: registry,
    abi: sbot3RegistryAbi,
    functionName: "totalIndexes",
  });

  console.log(`\n${total} indexes published in total.`);
};

main().catch((error) =>
  die(error instanceof Error ? error.message : String(error)),
);
