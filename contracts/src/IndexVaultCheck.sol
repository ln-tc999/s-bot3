// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IndexVault} from "./IndexVault.sol";
import {MockERC20} from "./MockERC20.sol";
import {SBot3Registry} from "./SBot3Registry.sol";
import {DelegatedAgent} from "./SBot3RegistryCheck.sol";
import {TokenBook} from "./TokenBook.sol";

/// @notice Settlement in kind, as one runnable check.
///
/// Call `check()`: it returns true, or it reverts naming the assertion that
/// failed. No framework, no test runner.
///
/// Unlike `SBot3RegistryCheck` this one is handed its dependencies rather than
/// building them, because a contract carries the creation bytecode of
/// everything it deploys internally and carrying a registry, a book, a token
/// and a vault at once puts it over the 24 KB limit.
///
/// **Pass a throwaway registry**, not the one your site reads: `check()`
/// publishes a scratch index in whatever registry it is given, and nothing can
/// unpublish it. The book and the tokens can be your real ones — it only reads
/// the bindings and mints from the mocks, both of which anyone can already do.
contract IndexVaultCheck {
    string private constant LABEL = "vault-check";

    /// Somewhere that is not this contract, so "the owner was paid" is an
    /// assertion about a balance that moved rather than a self transfer.
    address private constant SINK = address(uint160(0xFEE));

    SBot3Registry private immutable registry;
    TokenBook private immutable book;
    MockERC20 private immutable btc;
    MockERC20 private immutable eth;

    /// `_book` must already bind "btc" and "eth" to `_btc` and `_eth`.
    constructor(SBot3Registry _registry, TokenBook _book, MockERC20 _btc, MockERC20 _eth) {
        registry = _registry;
        book = _book;
        btc = _btc;
        eth = _eth;
    }

    function check() external returns (bool) {
        require(book.addressOf("btc") == address(btc), "book: btc not bound");
        require(book.addressOf("eth") == address(eth), "book: eth not bound");

        // A symbol already bound cannot be repointed, so two indexes can never
        // mean two different tokens by the same name.
        try book.register("btc", address(eth)) {
            revert("book: symbol repointed");
        } catch {}

        try book.addressOf("nothing-is-bound-to-this") returns (address) {
            revert("book: unknown symbol resolved");
        } catch {}

        _publish();

        IndexVault vault = _attach();

        btc.approve(address(vault), type(uint256).max);
        eth.approve(address(vault), type(uint256).max);

        _checkSubscribe(vault);
        _checkDrift(vault);
        _checkRedeem(vault);

        return true;
    }

    function _publish() private {
        string[] memory symbols = new string[](2);
        symbols[0] = "btc";
        symbols[1] = "eth";

        uint16[] memory weights = new uint16[](2);
        weights[0] = 5000;
        weights[1] = 5000;

        registry.create(LABEL, "Vault Check", symbols, weights, "");
    }

    /// Deploy the vault this check settles against, and attach it.
    function _attach() private returns (IndexVault vault) {
        uint256[] memory prices = new uint256[](2);
        prices[0] = 60_000e18;
        prices[1] = 3_000e18;

        // 20 bps charged, 5 of them paid out to this contract as the index
        // owner, so the split is exercised rather than only the default.
        vault = new IndexVault(
            "Check Share",
            "CHECK",
            LABEL,
            address(registry),
            address(book),
            prices,
            100e18,
            20,
            5,
            SINK
        );
        require(vault.ownerFeeBps() == 5, "vault: owner fee lost");
        require(vault.feeRecipient() == SINK, "vault: recipient lost");

        // A payout with nowhere to go is refused rather than burned, and the
        // owner's slice can never exceed the fee — past that, a subscription
        // would hand out money the shares already represent.
        _refuses(prices, 20, address(0), "vault: owner fee without a recipient");
        _refuses(prices, 21, SINK, "vault: owner fee above the fee");
        require(vault.navPerShare() == 100e18, "vault: empty nav is not the seed");

        // The guards on `setVault` itself are a registry claim and live in
        // SBot3RegistryCheck; this only needs the attachment to succeed.
        registry.setVault(LABEL, address(vault));
        require(registry.vaultOf(LABEL) == address(vault), "setVault: not stored");
    }

    /// One encoding site for both bad-constructor cases: each `new IndexVault`
    /// in its own try block costs real bytecode, and this contract has to stay
    /// under the 24 KB deployment limit.
    function _refuses(
        uint256[] memory prices,
        uint16 ownerFee,
        address recipient,
        string memory assertion
    ) private {
        try new IndexVault(
            "Bad", "BAD", LABEL, address(registry), address(book), prices, 100e18, 20, ownerFee, recipient
        ) {
            revert(string(abi.encodePacked(assertion, " accepted")));
        } catch {}
    }

    /// The fee is taken in kind and kept, so it raises what every remaining
    /// share is worth. That is the only reason it can be called yield.
    function _checkSubscribe(IndexVault vault) private {
        (uint256[] memory amounts,) = vault.previewSubscribe(10e18);
        require(amounts[0] > 0 && amounts[1] > 0, "subscribe: empty basket quoted");

        btc.mint(address(this), amounts[0]);
        eth.mint(address(this), amounts[1]);

        // The quote is live, so the approved ceiling is the only thing standing
        // between a rebalance and an unexpected pull.
        uint256[] memory nothing = new uint256[](2);
        try vault.subscribe(10e18, nothing) {
            revert("subscribe: maxAmounts ignored");
        } catch {}

        vault.subscribe(10e18, amounts);

        require(vault.balanceOf(address(this)) == 10e18, "subscribe: shares not minted");
        require(vault.navPerShare() > 100e18, "subscribe: fee did not accrue to nav");
        require(btc.balanceOf(SINK) > 0, "subscribe: owner slice not paid");
    }

    /// The agent moves the numbers; the holdings follow through the creation
    /// flow, not through trading. Nothing here needs a price feed or a venue.
    function _checkDrift(IndexVault vault) private {
        DelegatedAgent agent = new DelegatedAgent();
        registry.delegate(LABEL, address(agent));

        uint16[] memory tilted = new uint16[](2);
        tilted[0] = 8000;
        tilted[1] = 2000;
        agent.setWeights(registry, LABEL, tilted);

        uint256 drifted = vault.driftBps();
        require(drifted > 0, "drift: rebalance left no drift");

        (uint256[] memory amounts,) = vault.previewSubscribe(20e18);
        btc.mint(address(this), amounts[0]);
        eth.mint(address(this), amounts[1]);
        vault.subscribe(20e18, amounts);

        require(vault.driftBps() < drifted, "drift: subscription did not close it");

        registry.delegate(LABEL, address(0));
    }

    function _checkRedeem(IndexVault vault) private {
        uint256 shares = vault.balanceOf(address(this));
        uint256 navBefore = vault.navPerShare();

        uint256[] memory quoted = vault.previewRedeem(shares / 2);
        uint256 btcBefore = btc.balanceOf(address(this));
        uint256 ethBefore = eth.balanceOf(address(this));
        uint256 sinkBefore = btc.balanceOf(SINK);

        vault.redeem(shares / 2);

        require(btc.balanceOf(address(this)) == btcBefore + quoted[0], "redeem: quote disagreed");
        require(eth.balanceOf(address(this)) == ethBefore + quoted[1], "redeem: quote disagreed");
        require(vault.navPerShare() >= navBefore, "redeem: nav fell");
        require(btc.balanceOf(SINK) > sinkBefore, "redeem: owner slice not paid");

        // The round trip, stated in value rather than per token.
        //
        // Comparing quantities would be wrong: once the holdings have drifted,
        // a subscription arrives at the target weights while a redemption pays
        // out the actual mix, so the two baskets are legitimately different
        // shapes. What must never happen is getting more value back than the
        // same share count costs to mint.
        uint256 rest = vault.balanceOf(address(this));
        (, uint256 paid) = vault.previewSubscribe(rest);
        require(_notional(vault.previewRedeem(rest)) < paid, "redeem: returned more than it took");
    }

    /// The same unit of account the vault was deployed with.
    function _notional(uint256[] memory amounts) private pure returns (uint256) {
        return (amounts[0] * 60_000e18) / 1e8 + (amounts[1] * 3_000e18) / 1e18;
    }
}
