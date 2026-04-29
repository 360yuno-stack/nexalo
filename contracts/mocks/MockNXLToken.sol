// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockNXLToken {
    uint256 public availableRewards;
    address public treasuryBTC;

    function setAvailableRewards(uint256 amount) external {
        availableRewards = amount;
    }

    function getAvailableRewards() external view returns (uint256) {
        return availableRewards;
    }

    function setTreasuryBTC(address treasury) external {
        treasuryBTC = treasury;
    }

    function distributeReward(address, uint256 amount) external {
        if (availableRewards >= amount) {
            availableRewards -= amount;
        } else {
            availableRewards = 0;
        }
    }

    function burnUndistributed(uint256 amount) external {
        if (availableRewards >= amount) {
            availableRewards -= amount;
        } else {
            availableRewards = 0;
        }
    }
}