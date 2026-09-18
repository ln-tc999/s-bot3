// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SBot3RegistryCheck} from "../src/SBot3RegistryCheck.sol";

/// Runs the same assertions `check()` runs in Remix, under `forge test`.
contract SBot3RegistryTest {
    function test_RegistryCheck() public {
        require(new SBot3RegistryCheck().check(), "check() returned false");
    }
}
