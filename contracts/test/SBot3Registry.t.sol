// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IndexVaultCheck} from "../src/IndexVaultCheck.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {SBot3Registry} from "../src/SBot3Registry.sol";
import {SBot3RegistryCheck} from "../src/SBot3RegistryCheck.sol";
import {TokenBook} from "../src/TokenBook.sol";

/// Runs the same assertions `check()` runs in Remix, under `forge test`.
contract SBot3RegistryTest {
    function test_RegistryCheck() public {
        require(new SBot3RegistryCheck().check(), "registry check() returned false");
    }

    /// The settlement check is handed its dependencies rather than building
    /// them — see IndexVaultCheck — so the wiring Remix does by hand is done
    /// here in the test.
    function test_VaultCheck() public {
        SBot3Registry registry = new SBot3Registry();
        TokenBook book = new TokenBook();

        // Different decimals on purpose: the scaling between a weight and a
        // quantity is where an in-kind vault silently misprices if it is wrong.
        MockERC20 btc = new MockERC20("Mock Bitcoin", "mBTC", 8, 1e8);
        MockERC20 eth = new MockERC20("Mock Ether", "mETH", 18, 1e18);

        book.register("btc", address(btc));
        book.register("eth", address(eth));

        require(
            new IndexVaultCheck(registry, book, btc, eth).check(),
            "vault check() returned false"
        );
    }
}
