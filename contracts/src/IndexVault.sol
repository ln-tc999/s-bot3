// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "./ERC20.sol";

interface IERC20Min {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

interface IIndexRegistry {
    function symbolsOf(string calldata label) external view returns (string[] memory);
    function weightsOf(string calldata label) external view returns (uint16[] memory);
}

interface ITokenBook {
    function addressesOf(string[] memory symbols) external view returns (address[] memory);
}

/// @notice The share token of one index, settled in kind.
///
/// Subscribing does not pay in dollars. It delivers the basket itself — every
/// constituent, in the weights the registry publishes at that moment — and
/// mints shares against it. Redeeming returns a pro rata slice of what the
/// vault actually holds.
///
/// That asymmetry is the mechanism, not a compromise:
///
///   - subscriptions arrive at the *target* weights, so they pull the holdings
///     toward whatever the agent last published
///   - redemptions are pro rata of *actual* holdings, so the vault can never owe
///     more than it has, whatever the weights say
///
/// Nothing here is priced by an oracle. `unitPrices` is a fixed unit of account
/// declared once at deployment and never writable again — it converts a weight,
/// which is a share of value, into a quantity of tokens. It is not a claim about
/// what anything is worth on a market.
///
/// The vault copies no weights into storage. It reads them from the registry on
/// every subscribe, because a second copy is a second source of truth that can
/// disagree with the record, which is what this whole protocol argues against.
contract IndexVault is ERC20 {
    uint256 private constant ONE = 1e18;
    uint256 private constant BPS = 10_000;

    /// A ceiling, so "the fee stays with the holders" can never become a levy.
    uint16 public constant MAX_FEE_BPS = 100;

    /// The registry label whose composition this vault settles.
    string public label;

    address public immutable registry;

    /// Charged on subscribe and on redeem, in kind. Whatever is not paid out as
    /// `ownerFeeBps` stays in the basket, which raises `navPerShare` for everyone
    /// still holding — the only source of yield here.
    uint16 public immutable feeBps;

    /// The slice of `feeBps` paid to `feeRecipient` instead of left to holders.
    ///
    /// Capped at `feeBps` in the constructor, and that cap is what keeps
    /// `navPerShare` monotonic: the vault can only ever hand out money it just
    /// charged on top, never money the shares already represent. Set it equal to
    /// `feeBps` and NAV simply stops rising; it still cannot fall.
    uint16 public immutable ownerFeeBps;

    /// Where `ownerFeeBps` goes. Immutable, so it is disclosed before anyone
    /// subscribes and cannot be redirected afterwards.
    address public immutable feeRecipient;

    /// `navPerShare` before there is any supply to divide by.
    uint256 public immutable seedNav;

    address[] private _tokens;
    uint256[] private _unitPrices;
    uint256[] private _scales;

    event Subscribed(address indexed account, uint256 shares, uint256 notional);
    event Redeemed(address indexed account, uint256 shares, uint256 notional);

    error NoShares();
    error PriceRequired(uint256 index);
    error SeedRequired();
    error FeeTooHigh(uint16 got);
    error OwnerFeeTooHigh(uint16 ownerFeeBps, uint16 feeBps);
    error RecipientRequired();
    error PriceLengthMismatch(uint256 symbols, uint256 prices);
    error ExceedsMax(address token, uint256 required, uint256 allowed);
    error MaxLengthMismatch(uint256 tokens, uint256 maxAmounts);
    error TransferFailed(address token);
    error DustSubscription();

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _label,
        address _registry,
        address _tokenBook,
        uint256[] memory prices,
        uint256 _seedNav,
        uint16 _feeBps,
        uint16 _ownerFeeBps,
        address _feeRecipient
    ) ERC20(_name, _symbol, 18) {
        if (_seedNav == 0) revert SeedRequired();
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh(_feeBps);
        if (_ownerFeeBps > _feeBps) revert OwnerFeeTooHigh(_ownerFeeBps, _feeBps);
        if (_ownerFeeBps > 0 && _feeRecipient == address(0)) revert RecipientRequired();

        // Reverts UnknownIndex if the label was never published, so a vault can
        // not exist for an index that does not.
        string[] memory symbols = IIndexRegistry(_registry).symbolsOf(_label);
        if (symbols.length != prices.length) revert PriceLengthMismatch(symbols.length, prices.length);

        // Resolved from the book rather than accepted from the deployer, so the
        // person deploying the vault cannot bind `btc` to a token of their own.
        address[] memory bound = ITokenBook(_tokenBook).addressesOf(symbols);

        for (uint256 i; i < bound.length; ++i) {
            if (prices[i] == 0) revert PriceRequired(i);
            _tokens.push(bound[i]);
            _unitPrices.push(prices[i]);
            _scales.push(10 ** IERC20Min(bound[i]).decimals());
        }

        label = _label;
        registry = _registry;
        seedNav = _seedNav;
        feeBps = _feeBps;
        ownerFeeBps = _ownerFeeBps;
        feeRecipient = _feeRecipient;
    }

    // --- the record this vault settles against -----------------------------

    function tokens() external view returns (address[] memory) {
        return _tokens;
    }

    function unitPrices() external view returns (uint256[] memory) {
        return _unitPrices;
    }

    function constituents() external view returns (uint256) {
        return _tokens.length;
    }

    /// @notice The weights this vault is settling at right now, straight from
    /// the registry. A rebalance changes what the next subscription delivers.
    function weights() public view returns (uint16[] memory) {
        return IIndexRegistry(registry).weightsOf(label);
    }

    function holdings() public view returns (uint256[] memory amounts) {
        uint256 n = _tokens.length;
        amounts = new uint256[](n);
        for (uint256 i; i < n; ++i) {
            amounts[i] = IERC20Min(_tokens[i]).balanceOf(address(this));
        }
    }

    // --- valuation ---------------------------------------------------------

    /// @notice What the vault holds, in the declared unit of account.
    function totalNotional() public view returns (uint256 total) {
        uint256 n = _tokens.length;
        for (uint256 i; i < n; ++i) {
            total += (IERC20Min(_tokens[i]).balanceOf(address(this)) * _unitPrices[i]) / _scales[i];
        }
    }

    /// @notice Units of account per whole share.
    ///
    /// Derived from what is actually in the vault, never stated. It cannot fall:
    /// a subscription adds more than it mints and a redemption removes less than
    /// it burns, both by `feeBps`.
    function navPerShare() public view returns (uint256) {
        uint256 supply = totalSupply;
        if (supply == 0) return seedNav;
        return (totalNotional() * ONE) / supply;
    }

    /// @notice How far the holdings sit from the published weights, in bps.
    ///
    /// Half the total absolute deviation, so a vault holding nothing it should
    /// and everything it should not reads 10,000 rather than 20,000. Rises the
    /// moment an agent rebalances, and falls as subscriptions arrive at the new
    /// weights — it closes through the creation flow, not through trading.
    function driftBps() external view returns (uint256 drift) {
        uint256 total = totalNotional();
        if (total == 0) return 0;

        uint16[] memory target = weights();
        uint256 n = _tokens.length;

        for (uint256 i; i < n; ++i) {
            uint256 held = (IERC20Min(_tokens[i]).balanceOf(address(this)) * _unitPrices[i]) / _scales[i];
            uint256 actual = (held * BPS) / total;
            drift += actual > target[i] ? actual - target[i] : target[i] - actual;
        }

        drift /= 2;
    }

    // --- subscribe ---------------------------------------------------------

    /// @notice The basket that mints `shares`, fee included, at today's weights.
    ///
    /// Quote it immediately before subscribing: an agent may rebalance in the
    /// meantime, which is exactly what `maxAmounts` is there to bound.
    function previewSubscribe(uint256 shares)
        public
        view
        returns (uint256[] memory amounts, uint256 notional)
    {
        if (shares == 0) revert NoShares();

        notional = _mulDivUp(shares, navPerShare(), ONE);

        uint16[] memory target = weights();
        uint256 n = _tokens.length;
        amounts = new uint256[](n);

        for (uint256 i; i < n; ++i) {
            if (target[i] == 0) continue;
            // The fee is charged on the way in and kept, so the depositor hands
            // over a little more basket than the shares they receive represent.
            uint256 slice = _mulDivUp(notional, uint256(target[i]) * (BPS + feeBps), BPS * BPS);
            amounts[i] = _mulDivUp(slice, _scales[i], _unitPrices[i]);
        }
    }

    /// @notice Deliver the basket, receive shares.
    ///
    /// `maxAmounts` is the in-kind form of slippage protection: the weights are
    /// read live, so a rebalance between the quote and the block that includes
    /// this call would otherwise pull a different basket than the one approved.
    function subscribe(uint256 shares, uint256[] calldata maxAmounts) external returns (uint256 notional) {
        uint256 n = _tokens.length;
        if (maxAmounts.length != n) revert MaxLengthMismatch(n, maxAmounts.length);

        uint256[] memory amounts;
        (amounts, notional) = previewSubscribe(shares);

        bool any;
        for (uint256 i; i < n; ++i) {
            uint256 amount = amounts[i];
            if (amount == 0) continue;
            if (amount > maxAmounts[i]) revert ExceedsMax(_tokens[i], amount, maxAmounts[i]);
            any = true;

            /**
             * The owner's slice of the fee goes straight from the subscriber to
             * the recipient rather than through the vault, so the vault never
             * holds money that is not backing a share.
             *
             * It is floored, and it is a slice of the surcharge only — never of
             * the basket the shares represent — which is what keeps
             * `navPerShare` from falling.
             */
            uint256 toOwner = ownerFeeBps == 0
                ? 0
                : (amount * ownerFeeBps) / (BPS + feeBps);

            if (
                !IERC20Min(_tokens[i]).transferFrom(msg.sender, address(this), amount - toOwner)
            ) {
                revert TransferFailed(_tokens[i]);
            }

            if (
                toOwner > 0
                    && !IERC20Min(_tokens[i]).transferFrom(msg.sender, feeRecipient, toOwner)
            ) {
                revert TransferFailed(_tokens[i]);
            }
        }
        // Every constituent rounded to nothing, so this would mint against an
        // empty delivery.
        if (!any) revert DustSubscription();

        _mint(msg.sender, shares);
        emit Subscribed(msg.sender, shares, notional);
    }

    // --- redeem ------------------------------------------------------------

    /// @notice A pro rata slice of the actual holdings, less the fee.
    ///
    /// Not the published weights: if the agent has rebalanced and the holdings
    /// have not caught up, this is what is really there, which is the only thing
    /// the vault can honestly hand back.
    function previewRedeem(uint256 shares) public view returns (uint256[] memory amounts) {
        if (shares == 0) revert NoShares();

        uint256 supply = totalSupply;
        uint256 n = _tokens.length;
        amounts = new uint256[](n);
        if (supply == 0) return amounts;

        for (uint256 i; i < n; ++i) {
            uint256 held = IERC20Min(_tokens[i]).balanceOf(address(this));
            // Floor twice, both toward the vault, so redemption can never round
            // its way into paying out more than the share is worth.
            amounts[i] = ((held * shares) / supply) * (BPS - feeBps) / BPS;
        }
    }

    function redeem(uint256 shares) external returns (uint256[] memory amounts) {
        amounts = previewRedeem(shares);

        uint256 supply = totalSupply;
        uint256 notional;
        uint256 n = _tokens.length;
        for (uint256 i; i < n; ++i) {
            notional += (amounts[i] * _unitPrices[i]) / _scales[i];
        }

        /**
         * The owner's slice, taken from the fee that was withheld rather than
         * from the payout. Computed before the burn, against the same gross
         * slice `previewRedeem` floored, and floored again — so it is always
         * strictly less than what was withheld.
         */
        uint256[] memory toOwner = new uint256[](n);
        if (ownerFeeBps > 0 && supply > 0) {
            for (uint256 i; i < n; ++i) {
                uint256 gross =
                    (IERC20Min(_tokens[i]).balanceOf(address(this)) * shares) / supply;
                toOwner[i] = (gross * ownerFeeBps) / BPS;
            }
        }

        _burn(msg.sender, shares);

        for (uint256 i; i < n; ++i) {
            if (amounts[i] > 0 && !IERC20Min(_tokens[i]).transfer(msg.sender, amounts[i])) {
                revert TransferFailed(_tokens[i]);
            }
            if (toOwner[i] > 0 && !IERC20Min(_tokens[i]).transfer(feeRecipient, toOwner[i])) {
                revert TransferFailed(_tokens[i]);
            }
        }

        emit Redeemed(msg.sender, shares, notional);
    }

    function _mulDivUp(uint256 a, uint256 b, uint256 d) private pure returns (uint256) {
        return (a * b + d - 1) / d;
    }
}
