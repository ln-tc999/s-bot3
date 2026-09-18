// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "./ERC20.sol";

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @notice The share token of one index. Deposits take the quote asset and mint
/// shares at a fixed price; redemptions burn shares and return quote. Because
/// the price never moves, the vault is solvent by construction — it only ever
/// owes back what a depositor put in.
///
/// It deliberately does not hold the constituents. The composition lives in the
/// registry under `label` and is read from there; duplicating it in storage
/// would create a second source of truth that can disagree with the record,
/// which is exactly what this protocol is arguing against.
contract IndexVault is ERC20 {
    /// The registry label whose methodology this vault tracks.
    string public label;

    IERC20 public immutable quote;

    /// Quote-token units per whole (1e18) share. Fixed: this is a testnet
    /// settlement stub, not a pricing oracle.
    uint256 public immutable sharePrice;

    event Deposited(address indexed account, uint256 quoteAmount, uint256 shares);
    event Redeemed(address indexed account, uint256 shares, uint256 quoteAmount);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _label,
        address _quote,
        uint256 _sharePrice
    ) ERC20(_name, _symbol, 18) {
        require(_sharePrice > 0, "IndexVault: price");
        require(_quote != address(0), "IndexVault: quote");
        label = _label;
        quote = IERC20(_quote);
        sharePrice = _sharePrice;
    }

    function previewDeposit(uint256 quoteAmount) public view returns (uint256) {
        return (quoteAmount * 1e18) / sharePrice;
    }

    function previewRedeem(uint256 shares) public view returns (uint256) {
        return (shares * sharePrice) / 1e18;
    }

    function deposit(uint256 quoteAmount) external returns (uint256 shares) {
        shares = previewDeposit(quoteAmount);
        require(shares > 0, "IndexVault: dust");
        require(quote.transferFrom(msg.sender, address(this), quoteAmount), "IndexVault: pull");
        _mint(msg.sender, shares);
        emit Deposited(msg.sender, quoteAmount, shares);
    }

    function redeem(uint256 shares) external returns (uint256 quoteAmount) {
        quoteAmount = previewRedeem(shares);
        require(quoteAmount > 0, "IndexVault: dust");
        _burn(msg.sender, shares);
        require(quote.transfer(msg.sender, quoteAmount), "IndexVault: push");
        emit Redeemed(msg.sender, shares, quoteAmount);
    }
}
