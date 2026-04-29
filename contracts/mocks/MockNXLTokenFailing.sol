// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../NexumManager.sol";

contract MockNXLTokenFailing is INXLToken, INXLTokenTreasuryConfig {
    mapping(address => uint256) public rewarded;

    uint256 public availableRewards;
    bool public failDistribute = true;
    address public override treasuryBTC;

    constructor() {}

    function setAvailableRewards(uint256 v) external {
        availableRewards = v;
    }

    function setFailDistribute(bool v) external {
        failDistribute = v;
    }

    function setTreasuryBTC(address _treasuryBTC) external override {
        treasuryBTC = _treasuryBTC;
    }

    function getAvailableRewards() external view override returns (uint256) {
        return availableRewards;
    }

    function distributeReward(address recipient, uint256 amount) external override {
        require(!failDistribute, "forced fail");
        require(availableRewards >= amount, "insufficient rewards");
        availableRewards -= amount;
        rewarded[recipient] += amount;
    }

    function burnUndistributed(uint256 amount) external override {
        require(availableRewards >= amount, "insufficient");
        availableRewards -= amount;
    }
}