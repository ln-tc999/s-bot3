// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice The symbol to token binding, as a public record.
///
/// The registry deliberately stores no addresses: an index publishes a symbol
/// and a weight, and inventing a contract for the symbol would be the registry
/// asserting something the record does not say. But settlement in kind needs an
/// address for `btc`, so the binding has to live somewhere.
///
/// It lives here, written once per symbol and never again. Anyone may register
/// a symbol nobody has claimed; nobody may repoint one that is already bound,
/// so two indexes can never settle `btc` against two different tokens.
contract TokenBook {
    mapping(bytes32 => address) private _tokens;
    string[] private _symbols;

    event SymbolRegistered(string symbol, address indexed token);

    error EmptySymbol();
    error ZeroToken();
    error SymbolTaken(string symbol, address boundTo);
    error UnknownSymbol(string symbol);

    function register(string calldata symbol, address token) external {
        if (bytes(symbol).length == 0) revert EmptySymbol();
        if (token == address(0)) revert ZeroToken();

        bytes32 key = keccak256(bytes(symbol));
        address bound = _tokens[key];
        if (bound != address(0)) revert SymbolTaken(symbol, bound);

        _tokens[key] = token;
        _symbols.push(symbol);
        emit SymbolRegistered(symbol, token);
    }

    /// @notice The token bound to a symbol. Reverts rather than returning zero,
    /// so a caller can never settle against address(0) by forgetting to check.
    function addressOf(string memory symbol) public view returns (address token) {
        token = _tokens[keccak256(bytes(symbol))];
        if (token == address(0)) revert UnknownSymbol(symbol);
    }

    /// @notice Resolve a whole index's symbols in one read. Memory rather than
    /// calldata so a vault constructor can pass what it just read from the registry.
    function addressesOf(string[] memory symbols) public view returns (address[] memory tokens) {
        tokens = new address[](symbols.length);
        for (uint256 i; i < symbols.length; ++i) {
            tokens[i] = addressOf(symbols[i]);
        }
    }

    function isRegistered(string calldata symbol) external view returns (bool) {
        return _tokens[keccak256(bytes(symbol))] != address(0);
    }

    function allSymbols() external view returns (string[] memory) {
        return _symbols;
    }

    function totalSymbols() external view returns (uint256) {
        return _symbols.length;
    }
}
