// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IndexVault} from "./IndexVault.sol";
import {MockERC20} from "./MockERC20.sol";
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

/// @notice One runnable check for the claims that are not obvious from reading.
/// Deploy it in Remix and call `check()`: it returns true, or it reverts with
/// the assertion that failed. No framework, no test runner.
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

        _checkVault(r);

        return true;
    }

    /**
     * Settlement: the vault attaches once, and a deposit followed by an
     * immediate redeem can never hand back more than it took. Integer division
     * rounds toward the vault, so the shortfall is the vault's margin, not the
     * depositor's loss of principal beyond one wei of dust.
     */
    function _checkVault(SBot3Registry r) private {
        MockERC20 quote = new MockERC20("Mock USD", "mUSDC", 6, 1_000e6);
        IndexVault vault = new IndexVault("Demo Share", "DEMO", "demo", address(quote), 100e6);

        try r.setVault("demo", address(0)) {
            revert("setVault: zero accepted");
        } catch {}

        r.setVault("demo", address(vault));
        require(r.vaultOf("demo") == address(vault), "setVault: not stored");

        // Set once, and there is no second call that could move it.
        IndexVault other = new IndexVault("Other", "OTHR", "demo", address(quote), 100e6);
        try r.setVault("demo", address(other)) {
            revert("setVault: vault was replaceable");
        } catch {}

        quote.mint(address(this), 500e6);
        quote.approve(address(vault), 500e6);

        uint256 before = quote.balanceOf(address(this));
        uint256 shares = vault.deposit(500e6);
        require(shares == 5e18, "vault: wrong share count");

        uint256 returned = vault.redeem(shares);
        require(returned <= 500e6, "vault: returned more than it took");
        require(quote.balanceOf(address(this)) <= before, "vault: minted value from nothing");
    }
}
