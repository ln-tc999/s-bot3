// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "./ERC20.sol";

/// @notice A stand-in constituent, for testnet. Anyone can mint, which is the
/// point: subscribing delivers the whole basket, so a visitor has to be able to
/// assemble one without asking anyone.
///
/// Bind it to a symbol in `TokenBook` and vaults settle against it like any
/// other ERC20. On mainnet the book binds real tokens and this is not deployed
/// at all. Never deploy it to a network where the balance is supposed to mean
/// something.
contract MockERC20 is ERC20 {
    /// One `faucet()` claim. Denominated in whole units by the deploy script.
    uint256 public immutable faucetAmount;

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _faucetAmount)
        ERC20(_name, _symbol, _decimals)
    {
        faucetAmount = _faucetAmount;
    }

    function mint(address to, uint256 value) public {
        _mint(to, value);
    }

    function faucet() external {
        _mint(msg.sender, faucetAmount);
    }

    function burn(uint256 value) external {
        _burn(msg.sender, value);
    }
}
