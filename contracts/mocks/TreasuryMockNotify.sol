// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TreasuryMockNotify {
    event Notified(uint256 amount);
    function onFundsReceived(uint256 amount) external { emit Notified(amount); }
}
