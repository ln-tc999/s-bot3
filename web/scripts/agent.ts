/**
 * The delegated rebalancing agent.
 *
 *   pnpm agent <label> equal              # every constituent the same weight
 *   pnpm agent <label> 8000,2000          # explicit basis points, must total 10,000
 *   pnpm agent <label> equal --dry        # print the plan, sign nothing
 *
 * Reads the registry with `PRIVATE_KEY` from the environment and nothing else.
 * This is the whole of what an agent can do: it holds the weight key and no
 * other, so every other function on the registry refuses it — the contract is
 * what enforces that, not this script's restraint.
 */
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sbot3RegistryAbi } from "../src/lib/chain/abi";
import { botMainnet, botTestnet } from "../src/lib/chain/chains";
import { indexVaultAbi } from "../src/lib/chain/vault";

const TOTAL_BPS = 10_000;
const ZERO = "0x0000000000000000000000000000000000000000";

const die: (message: string) => never = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const [label, plan, ...flags] = process.argv.slice(2);
const isDry = flags.includes("--dry");

if (!label || !plan) {
  die("usage: pnpm agent <label> <equal|bps,bps,…> [--dry]");
}

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

/**
 * Equal weights have to be exact, not approximately equal: the contract rejects
 * anything that does not total 10,000, so the rounding remainder goes somewhere
 * deliberate rather than being lost.
 */
const equalWeights = (count: number): number[] => {
  const each = Math.floor(TOTAL_BPS / count);
  const weights = Array.from({ length: count }, () => each);
  weights[0] += TOTAL_BPS - each * count;
  return weights;
};

const parseWeights = (input: string, count: number): number[] => {
  if (input === "equal") {
    return equalWeights(count);
  }

  const weights = input.split(",").map((part) => Number(part.trim()));

  if (weights.some((weight) => !Number.isInteger(weight) || weight < 0)) {
    die("weights must be whole, non-negative basis points");
  }
  if (weights.length !== count) {
    die(`this index has ${count} constituents, got ${weights.length} weights`);
  }

  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total !== TOTAL_BPS) {
    die(`weights total ${total} bps, must be exactly ${TOTAL_BPS}`);
  }

  return weights;
};

const readDrift = async (vault: `0x${string}`): Promise<string> => {
  try {
    const bps = await publicClient.readContract({
      address: vault,
      abi: indexVaultAbi,
      functionName: "driftBps",
    });
    return `${(Number(bps) / 100).toFixed(2)}%`;
  } catch {
    return "n/a";
  }
};

const main = async () => {
  const [owner, agent, vault, locked, , name, , symbols, weights] =
    await publicClient.readContract({
      address: registry,
      abi: sbot3RegistryAbi,
      functionName: "getIndex",
      args: [label],
    });

  const next = parseWeights(plan, symbols.length);

  console.log(`${name} (${label}) on ${chain.name}`);
  console.log(`  methodology  ${locked ? "locked" : "editable by the owner"}`);
  console.log(`  agent        ${agent === ZERO ? "nobody delegated" : agent}`);

  for (const [index, symbol] of symbols.entries()) {
    const from = (weights[index] / 100).toFixed(2);
    const to = (next[index] / 100).toFixed(2);
    const arrow = weights[index] === next[index] ? "  =" : " ->";
    console.log(
      `  ${symbol.padEnd(6)} ${from.padStart(6)}%${arrow} ${to.padStart(6)}%`,
    );
  }

  if (vault !== ZERO) {
    console.log(`  drift now    ${await readDrift(vault)}`);
  }

  if (isDry) {
    console.log("\n--dry: nothing signed.");
    return;
  }

  const key = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  if (!key) {
    die("set PRIVATE_KEY to the delegated agent's key");
  }

  const account = privateKeyToAccount(key);
  const me = account.address.toLowerCase();

  /**
   * Checked here only to fail with a sentence instead of a revert. The refusal
   * that matters is the contract's, and it applies whatever this script thinks.
   */
  if (me !== agent.toLowerCase() && me !== owner.toLowerCase()) {
    die(
      `${account.address} is neither the owner nor the delegated agent of "${label}"`,
    );
  }

  const wallet = createWalletClient({
    account,
    chain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL),
  });

  console.log(
    `\nsigning as ${account.address}${me === agent.toLowerCase() ? " (agent)" : " (owner)"}`,
  );

  const hash = await wallet.writeContract({
    address: registry,
    abi: sbot3RegistryAbi,
    functionName: "setWeights",
    args: [label, next],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  console.log(`✓ rebalanced — ${chain.blockExplorers.default.url}/tx/${hash}`);

  if (vault !== ZERO) {
    console.log(`  drift after  ${await readDrift(vault)}`);
    console.log(
      "  it closes as subscriptions arrive at the new weights, not by trading",
    );
  }
};

main().catch((error) =>
  die(error instanceof Error ? error.message : String(error)),
);
