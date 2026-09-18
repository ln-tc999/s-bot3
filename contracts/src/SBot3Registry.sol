// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice s-bot3 — index funds whose composition is the public record.
///
/// The ENSv2 build resolves an index out of a name: constituents are wildcard
/// subnames, the methodology is a contenthash, and the lock is a burnt resolver
/// role. BOT Chain has no ENS, so that substrate is gone. What survives is the
/// argument it was making, and this contract makes it without a namespace:
///
///   - the composition IS the public record — one read, no SDK, no indexer
///   - the methodology can be frozen, and the freeze is a fact anyone can read
///   - a delegated agent can move the numbers and can never move the rules
///
/// One contract, zero dependencies, zero permissioned transfers. Any wallet can
/// publish, so a stranger's wallet is never a special case.
contract SBot3Registry {
    /// Weights are basis points and must always total exactly this.
    uint16 public constant TOTAL_BPS = 10_000;

    struct Index {
        address owner;
        /// May write weights and nothing else. address(0) = no delegation.
        address agent;
        /// Irreversible once true. Freezes name and methodology, never weights.
        bool locked;
        /// The share token this index settles in. Set once, then permanent.
        address vault;
        uint64 createdAt;
        string name;
        string methodology;
        string[] symbols;
    }

    mapping(bytes32 => Index) private _indexes;
    mapping(bytes32 => mapping(bytes32 => uint16)) private _weights;
    string[] private _labels;

    event IndexCreated(string label, address indexed owner, string name, uint256 constituents);
    event MethodologyChanged(string label, string methodology);
    event MethodologyLocked(string label, address indexed by);
    event AgentDelegated(string label, address indexed agent);
    event WeightsChanged(string label, address indexed by);
    event VaultSet(string label, address indexed vault);

    error EmptyLabel();
    error EmptyIndex();
    error LabelTaken(string label);
    error UnknownIndex(string label);
    error NotOwner(string label, address caller);
    error NotOwnerOrAgent(string label, address caller);
    error IsLocked(string label);
    error AlreadyLocked(string label);
    error LengthMismatch(uint256 symbols, uint256 weights);
    error WeightsMustTotal(uint256 got);
    error DuplicateSymbol(string symbol);
    error VaultAlreadySet(string label);
    error ZeroVault();

    function _key(string memory label) private pure returns (bytes32) {
        return keccak256(bytes(label));
    }

    function _get(string calldata label) private view returns (Index storage ix) {
        ix = _indexes[_key(label)];
        if (ix.owner == address(0)) revert UnknownIndex(label);
    }

    /// @notice Publish an index. One transaction, no approval, no allowlist.
    /// The caller owns what it publishes; this contract keeps nothing.
    function create(
        string calldata label,
        string calldata name,
        string[] calldata symbols,
        uint16[] calldata weights,
        string calldata methodology
    ) external {
        if (bytes(label).length == 0) revert EmptyLabel();
        if (symbols.length == 0) revert EmptyIndex();
        if (symbols.length != weights.length) revert LengthMismatch(symbols.length, weights.length);

        bytes32 key = _key(label);
        if (_indexes[key].owner != address(0)) revert LabelTaken(label);

        Index storage ix = _indexes[key];
        ix.owner = msg.sender;
        ix.createdAt = uint64(block.timestamp);
        ix.name = name;
        ix.methodology = methodology;

        uint256 total;
        for (uint256 i; i < symbols.length; ++i) {
            bytes32 sym = keccak256(bytes(symbols[i]));
            // A duplicate symbol would make getIndex report one weight twice
            // while the sum counted both, so the published total would not match
            // what anyone reads back.
            // ponytail: O(n^2) scan. An index is a handful of assets; swap in a
            // seen-mapping if anyone ever publishes hundreds.
            for (uint256 j; j < i; ++j) {
                if (keccak256(bytes(symbols[j])) == sym) revert DuplicateSymbol(symbols[i]);
            }
            ix.symbols.push(symbols[i]);
            _weights[key][sym] = weights[i];
            total += weights[i];
        }
        if (total != TOTAL_BPS) revert WeightsMustTotal(total);

        _labels.push(label);
        emit IndexCreated(label, msg.sender, name, symbols.length);
    }

    /// @notice Freeze the methodology. Irreversible, by anyone's reading — there
    /// is no unlock function and no admin on this contract to add one.
    function lock(string calldata label) external {
        Index storage ix = _get(label);
        if (msg.sender != ix.owner) revert NotOwner(label, msg.sender);
        if (ix.locked) revert AlreadyLocked(label);
        ix.locked = true;
        emit MethodologyLocked(label, msg.sender);
    }

    function setMethodology(string calldata label, string calldata methodology) external {
        Index storage ix = _get(label);
        if (msg.sender != ix.owner) revert NotOwner(label, msg.sender);
        if (ix.locked) revert IsLocked(label);
        ix.methodology = methodology;
        emit MethodologyChanged(label, methodology);
    }

    /// @notice Scope the weight key to an agent. Pass address(0) to revoke.
    function delegate(string calldata label, address agent) external {
        Index storage ix = _get(label);
        if (msg.sender != ix.owner) revert NotOwner(label, msg.sender);
        ix.agent = agent;
        emit AgentDelegated(label, agent);
    }

    /**
     * @notice Attach the share token this index settles in.
     *
     * Set once and never again. A vault that could be swapped later would let
     * an owner point the name at a new contract after people had already
     * deposited into the old one, which is the failure this whole design is
     * arguing against — so the setter simply has no second call.
     */
    function setVault(string calldata label, address vault) external {
        Index storage ix = _get(label);
        if (msg.sender != ix.owner) revert NotOwner(label, msg.sender);
        if (vault == address(0)) revert ZeroVault();
        if (ix.vault != address(0)) revert VaultAlreadySet(label);
        ix.vault = vault;
        emit VaultSet(label, vault);
    }

    /// @notice Rebalance. Owner or delegated agent, in the stored symbol order.
    ///
    /// Deliberately callable after `lock`: the lock covers the rules, not the
    /// numbers. That asymmetry is the whole claim, so it is enforced here rather
    /// than documented somewhere. The full vector is replaced every time, so the
    /// 10,000 bps invariant cannot drift through a partial update.
    function setWeights(string calldata label, uint16[] calldata weights) external {
        Index storage ix = _get(label);
        if (msg.sender != ix.owner && msg.sender != ix.agent) revert NotOwnerOrAgent(label, msg.sender);

        uint256 n = ix.symbols.length;
        if (weights.length != n) revert LengthMismatch(n, weights.length);

        bytes32 key = _key(label);
        uint256 total;
        for (uint256 i; i < n; ++i) {
            _weights[key][keccak256(bytes(ix.symbols[i]))] = weights[i];
            total += weights[i];
        }
        if (total != TOTAL_BPS) revert WeightsMustTotal(total);

        emit WeightsChanged(label, msg.sender);
    }

    /// @notice Everything about an index in one call, so a page render is one read.
    function getIndex(string calldata label)
        external
        view
        returns (
            address owner,
            address agent,
            address vault,
            bool locked,
            uint64 createdAt,
            string memory name,
            string memory methodology,
            string[] memory symbols,
            uint16[] memory weights
        )
    {
        Index storage ix = _get(label);
        bytes32 key = _key(label);

        symbols = ix.symbols;
        weights = new uint16[](symbols.length);
        for (uint256 i; i < symbols.length; ++i) {
            weights[i] = _weights[key][keccak256(bytes(symbols[i]))];
        }

        return (
            ix.owner, ix.agent, ix.vault, ix.locked, ix.createdAt, ix.name, ix.methodology, symbols, weights
        );
    }

    function weightOf(string calldata label, string calldata symbol) external view returns (uint16) {
        return _weights[_key(label)][keccak256(bytes(symbol))];
    }

    function exists(string calldata label) external view returns (bool) {
        return _indexes[_key(label)].owner != address(0);
    }

    function isLocked(string calldata label) external view returns (bool) {
        return _get(label).locked;
    }

    function vaultOf(string calldata label) external view returns (address) {
        return _get(label).vault;
    }

    function totalIndexes() external view returns (uint256) {
        return _labels.length;
    }

    /// @notice Every label ever published, for listing without an indexer.
    function allLabels() external view returns (string[] memory) {
        return _labels;
    }
}
