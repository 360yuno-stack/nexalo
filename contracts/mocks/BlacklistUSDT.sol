// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BlacklistUSDT is ERC20 {
    mapping(address => bool) public blacklisted;
    uint8 private _dec;

    constructor() ERC20("Blacklist USDT", "bUSDT") {
        _dec = 6;
    }

    function decimals() public view override returns (uint8) {
        return _dec;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setBlacklisted(address a, bool v) external {
        blacklisted[a] = v;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (to != address(0) && blacklisted[to]) revert("BLACKLISTED");
        super._update(from, to, value);
    }
}
