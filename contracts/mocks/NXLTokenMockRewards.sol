// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NXLTokenMockRewards {
    uint256 public available = 10_000_000e18; // huge

    address public treasuryBTC;

    function setTreasuryBTC(address t) external { treasuryBTC = t; }

    function getAvailableRewards() external view returns (uint256) { return available; }

    function distributeReward(address, uint256 amount) external {
        require(available >= amount, "Insufficient rewards");
        available -= amount;
    }

    function burnUndistributed(uint256 amount) external {
        require(available >= amount, "Insufficient rewards");
        available -= amount;
    }
}
