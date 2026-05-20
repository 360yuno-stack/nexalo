// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../NexumManager.sol";

/**
 * @title NexumManagerHarness
 * @dev Test harness that exposes internal functions for testing NXL accrual.
 *      NEVER deploy to production.
 */
contract NexumManagerHarness is NexumManager {
    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        address _stablecoin,
        address _nxlToken,
        address _founderAddress,
        address _partnerAddress,
        address _feesReceiver,
        address _operationsService,
        address _auditFundsAddress,
        address _pauseGuardian
    ) NexumManager(
        _vrfCoordinator,
        _subscriptionId,
        _keyHash,
        _stablecoin,
        _nxlToken,
        _founderAddress,
        _partnerAddress,
        _feesReceiver,
        _operationsService,
        _auditFundsAddress,
        _pauseGuardian
    ) {}

    /// @dev Expose internal NXL accrual function for testing
    function testAccrueNXL(address user, uint256 amount, uint256 productId) external {
        _safeDistributeOrAccrueNXL(user, amount, productId);
    }
}
