// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "./ERC20.sol";

/// @notice The quote asset every vault settles in. Anyone can mint, which is
/// the point: a visitor has to be able to fund a wallet without asking anyone.
/// Never deploy this to a network where the balance is supposed to mean
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
