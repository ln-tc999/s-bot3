// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SBot3Registry} from "./SBot3Registry.sol";

/// Stands in for the rebalancing agent, so the delegation can be exercised from
/// an address that is not the owner without needing a second signer.
contract DelegatedAgent {
    function setWeights(SBot3Registry r, string calldata label, uint16[] calldata w) external {
        r.setWeights(label, w);
    }

    function setMethodology(SBot3Registry r, string calldata label, string calldata m) external {
        r.setMethodology(label, m);
    }

    function setVault(SBot3Registry r, string calldata label, address vault) external {
        r.setVault(label, vault);
    }
}

/// Answers `label()`, which is all `setVault` asks of a vault. Using stubs here
/// rather than a real `IndexVault` is not a shortcut: the guard is a registry
/// claim, and the registry only ever calls this one function.
contract LabelStub {
    string public label;

    constructor(string memory _label) {
        label = _label;
    }
}

/// @notice The registry's claims, as one runnable check.
///
/// Deploy it in Remix and call `check()`: it returns true, or it reverts with
/// the assertion that failed. No framework, no test runner.
///
/// Settlement is checked separately, by `IndexVaultCheck`. Together they exceed
/// the 24 KB contract limit, because each one carries the creation bytecode of
/// everything it deploys internally — so they are two deployments and two green
/// calls rather than one.
contract SBot3RegistryCheck {
    function check() external returns (bool) {
        SBot3Registry r = new SBot3Registry();
        DelegatedAgent agent = new DelegatedAgent();

        string[] memory symbols = new string[](2);
        symbols[0] = "btc";
        symbols[1] = "eth";

        uint16[] memory weights = new uint16[](2);
        weights[0] = 6000;
        weights[1] = 4000;

        r.create("demo", "Demo Index", symbols, weights, "ipfs://methodology");

        require(r.exists("demo"), "create: not stored");
        require(r.totalIndexes() == 1, "create: not listed");
        require(r.weightOf("demo", "btc") == 6000, "create: weight lost");
        require(r.weightsOf("demo")[1] == 4000, "weightsOf: wrong order");
        require(
            keccak256(bytes(r.symbolsOf("demo")[0])) == keccak256(bytes("btc")), "symbolsOf: wrong order"
        );

        // Weights that do not total 10,000 bps are refused.
        uint16[] memory bad = new uint16[](2);
        bad[0] = 6000;
        bad[1] = 3999;
        try r.setWeights("demo", bad) {
            revert("invariant: 9999 bps accepted");
        } catch {}

        // A symbol published twice would read back inconsistently.
        string[] memory dupes = new string[](2);
        dupes[0] = "btc";
        dupes[1] = "btc";
        try r.create("dupe", "Dupe", dupes, weights, "") {
            revert("create: duplicate symbol accepted");
        } catch {}

        _checkConstituentCap(r);

        r.lock("demo");
        require(r.isLocked("demo"), "lock: not set");

        // The rules are frozen, for the owner too.
        try r.setMethodology("demo", "ipfs://rewritten") {
            revert("lock: owner still rewrote methodology");
        } catch {}

        // There is no second lock, so there is no path that toggles it back.
        try r.lock("demo") {
            revert("lock: relockable");
        } catch {}

        r.delegate("demo", address(agent));

        // The claim: the agent moves the numbers, after the lock.
        uint16[] memory rebalanced = new uint16[](2);
        rebalanced[0] = 5000;
        rebalanced[1] = 5000;
        agent.setWeights(r, "demo", rebalanced);
        require(r.weightOf("demo", "btc") == 5000, "agent: rebalance did not apply");

        // And never the rules — refused on its own key, not just by the lock.
        try agent.setMethodology(r, "demo", "ipfs://agent-rewrote-this") {
            revert("agent: reached methodology");
        } catch {}

        // The agent cannot attach a vault either.
        try agent.setVault(r, "demo", address(this)) {
            revert("agent: reached setVault");
        } catch {}

        // Revoking leaves the agent with nothing.
        r.delegate("demo", address(0));
        try agent.setWeights(r, "demo", rebalanced) {
            revert("revoke: agent still authorised");
        } catch {}

        _checkSetVault(r, agent);

        return true;
    }

    /**
     * The vault attaches once, and only to an address that says it settles this
     * label.
     *
     * Set-once protects a depositor from a vault swapped out underneath them;
     * the label check is what protects the first one. Whether the thing being
     * attached is a working vault is `IndexVaultCheck`'s business — the registry
     * only asks it to name the label it settles.
     */
    function _checkSetVault(SBot3Registry r, DelegatedAgent agent) private {
        try r.setVault("demo", address(0)) {
            revert("setVault: zero accepted");
        } catch {}

        // Nothing to ask `label()` of.
        try r.setVault("demo", address(agent)) {
            revert("setVault: non-conforming address accepted");
        } catch {}

        try r.setVault("demo", address(new LabelStub("not-demo"))) {
            revert("setVault: wrong label accepted");
        } catch {}

        address vault = address(new LabelStub("demo"));
        r.setVault("demo", vault);
        require(r.vaultOf("demo") == vault, "setVault: not stored");

        // Set once, and there is no second call that could move it.
        try r.setVault("demo", address(new LabelStub("demo"))) {
            revert("setVault: vault was replaceable");
        } catch {}
    }

    /// Settlement in kind touches every constituent in one transaction, so the
    /// list is capped rather than left to run out of gas in front of a user.
    function _checkConstituentCap(SBot3Registry r) private {
        uint256 n = r.MAX_CONSTITUENTS() + 1;
        string[] memory many = new string[](n);
        uint16[] memory split = new uint16[](n);

        uint256 each = 10_000 / n;
        for (uint256 i; i < n; ++i) {
            many[i] = string(abi.encodePacked("t", _digit(i)));
            split[i] = uint16(i == 0 ? 10_000 - each * (n - 1) : each);
        }

        try r.create("wide", "Too wide", many, split, "") {
            revert("create: constituent cap ignored");
        } catch {}
    }

    /// Just needs to be unique per index, not readable.
    function _digit(uint256 i) private pure returns (bytes1) {
        return bytes1(uint8(65 + i));
    }
}
