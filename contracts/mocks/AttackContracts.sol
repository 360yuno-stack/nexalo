// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReentrancyAttacker
 * @dev Malicious contract that attempts reentrancy on NexumManager claim functions.
 */
contract ReentrancyAttacker {
    address public target;
    uint8 public attackType; // 0=claimStable, 1=claimNXL
    uint256 public reentryCount;

    constructor(address _target) {
        target = _target;
    }

    function setAttackType(uint8 _type) external {
        attackType = _type;
    }

    function attack() external {
        if (attackType == 0) {
            (bool ok,) = target.call(abi.encodeWithSignature("claimStable()"));
            require(ok, "Initial claim failed");
        } else {
            (bool ok,) = target.call(abi.encodeWithSignature("claimNXL()"));
            require(ok, "Initial NXL claim failed");
        }
    }

    // ERC20 receive hook — attempt reentrancy when receiving tokens
    fallback() external {
        if (reentryCount < 3) {
            reentryCount++;
            if (attackType == 0) {
                (bool ok,) = target.call(abi.encodeWithSignature("claimStable()"));
                // Should fail with ReentrancyGuard
                require(!ok, "Reentrancy succeeded - CRITICAL BUG");
            }
        }
    }

    receive() external payable {}
}

/**
 * @title FlashLoanAttacker
 * @dev Simulates flash loan attack on TreasuryBTC redeem window.
 *      Attempts to: 1) borrow USDT 2) buy NXL 3) redeem NXL for USDT 4) repay
 *      Snapshot-based fix should block this.
 */
contract FlashLoanAttacker {
    address public treasury;
    address public nxlToken;
    address public stablecoin;

    constructor(address _treasury, address _nxlToken, address _stablecoin) {
        treasury = _treasury;
        nxlToken = _nxlToken;
        stablecoin = _stablecoin;
    }

    /// @dev Attack: acquire NXL AFTER window opens (post-snapshot) and try to redeem.
    ///      This MUST fail because snapshot was taken at window open.
    function attackRedeem(uint256 nxlAmount) external returns (bool success) {
        // Simulate: attacker has NXL acquired AFTER snapshot
        // Try to redeem — should revert because snapshot balance = 0 at window open
        (bool ok,) = treasury.call(
            abi.encodeWithSignature("redeem(uint256)", nxlAmount)
        );
        // We want this to FAIL (attack blocked)
        success = ok;
    }
}

/**
 * @title MaliciousAmbassador  
 * @dev Tests that ambassador claim cannot be re-entered.
 */
contract MaliciousAmbassador {
    address public registry;
    uint256 public reentryAttempts;

    constructor(address _registry) {
        registry = _registry;
    }

    function triggerClaim() external {
        (bool ok,) = registry.call(abi.encodeWithSignature("claim()"));
        require(ok, "Claim failed");
    }

    // Called when USDT transferred — attempt reentrancy
    fallback() external {
        reentryAttempts++;
        (bool ok,) = registry.call(abi.encodeWithSignature("claim()"));
        // ReentrancyGuard must block this
        require(!ok, "Reentrancy in ambassador claim - BUG");
    }

    receive() external payable {}
}
