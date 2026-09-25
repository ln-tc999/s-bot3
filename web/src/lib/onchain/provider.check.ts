/**
 * Assertions for `pickWallet`. Run it with:
 *   pnpm check:wallet
 *
 * The rule it guards is easy to undo by accident: an announced wallet must beat
 * the injected one. Getting it wrong connects a visitor to a wallet other than
 * the one they configured, and the symptom — "wrong network" in a wallet that
 * plainly has the network — points nowhere near the cause.
 */
import assert from "node:assert/strict";
import { pickWallet } from "./provider";

const RABBY = "io.rabby";
const METAMASK = "io.metamask";

// Nothing announced: no choice to make, and the caller falls back to injected.
assert.equal(pickWallet(null, []), null);
assert.equal(pickWallet(METAMASK, []), null);

// One announced wallet is unambiguous, so it wins over the injected guess.
assert.equal(pickWallet(null, [RABBY]), RABBY);

// Several announced and nothing remembered stays undecided: the picker asks.
assert.equal(pickWallet(null, [RABBY, METAMASK]), null);

// A remembered choice wins, but only while it is actually there.
assert.equal(pickWallet(METAMASK, [RABBY, METAMASK]), METAMASK);
assert.equal(pickWallet(METAMASK, [RABBY]), RABBY);

console.log("pickWallet: all assertions passed.");
