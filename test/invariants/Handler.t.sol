// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import "../../contracts/NexumManager.sol";
import "../../contracts/TestUSDT.sol";
import "../../contracts/NXLToken.sol";

/// @title Stateful Adversarial Simulation Handler
/// @dev Implements Chaos Engineering, Economic Griefing, and Differential Accounting
contract NexaloHandler is Test {
    NexumManager public manager;
    TestUSDT public usdt;
    
    // Ghost Variables for Differential Accounting
    uint256 public ghostExpectedPrizePot;
    uint256 public ghostExpectedInstantPot;
    uint256 public ghostExpectedTreasury;
    
    constructor(NexumManager _manager, TestUSDT _usdt) {
        manager = _manager;
        usdt = _usdt;
    }

    /// @notice Action: Randomly buy tickets simulating economic spam or normal buys
    function buyTickets(uint256 productId, uint256 quantity, uint256 userSeed) public {
        productId = productId % 6;
        
        // Allowed quantities: 1, 3, 5, 10 to avoid reverts hiding real issues
        uint256[4] memory allowed = [uint256(1), uint256(3), uint256(5), uint256(10)];
        quantity = allowed[quantity % 4];
        
        address user = address(uint160(userSeed % 1000 + 1));
        
        // Ensure user has funds
        usdt.mint(user, 100000 * 10**18);
        vm.prank(user);
        usdt.approve(address(manager), type(uint256).max);

        // Try to buy. We catch reverts because rounds might be full or products inactive
        vm.prank(user);
        try manager.buyTickets(productId, quantity, address(0)) {
            // If successful, update our Differential Accounting Engine
            // Assuming 1 USDT price for simplicity in Ghost state tracking (e.g., FLASH)
            if (productId == 0) {
                ghostExpectedPrizePot += (quantity * 10**18 * 50) / 100;
                ghostExpectedInstantPot += (quantity * 10**18 * 10) / 100;
                ghostExpectedTreasury += (quantity * 10**18 * 10) / 100;
            }
        } catch {
        }
    }

    /// @notice Action: Chaos Engineering — Trigger VRF Timeout (Liveness Failure test)
    function simulateVRFTimeout(uint256 productId) public {
        productId = productId % 6;
        uint256 currentRound = manager.currentRound(productId);
        
        // Warp time forward by 8 days to simulate VRF censorship / failure
        vm.warp(block.timestamp + 8 days);

        try manager.resolveStuckRound(productId, currentRound) {
        } catch {
        }
    }

    /// @notice Action: Chaos Engineering — Emergency Pause state interleaving
    function togglePause() public {
        // Only Guardian can pause
        if (manager.paused()) {
            vm.prank(manager.pauseGuardian());
            manager.emergencyUnpause();
        } else {
            vm.prank(manager.pauseGuardian());
            manager.emergencyPause();
        }
    }

    /// @notice Action: Simulate failed or delayed claims
    function claimStable(uint256 userSeed) public {
        address user = address(uint160(userSeed % 1000 + 1));
        
        vm.prank(user);
        try manager.claimStable() {
        } catch {
        }
    }
}
