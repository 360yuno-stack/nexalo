// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import "../../contracts/NexumManager.sol";
import "../../contracts/TestUSDT.sol";
import "../../contracts/NXLToken.sol";

/// @title Stateful Adversarial Simulation Handler
/// @notice Implements Chaos Engineering, Economic Griefing, and Differential Accounting.
///         Used by NexaloInvariantTest to drive randomized protocol interactions.
/// @dev Ghost variables track expected state for differential accounting validation.
contract NexaloHandler is Test {
    NexumManager public manager;
    TestUSDT public usdt;
    
    // ── Ghost Variables (Differential Accounting Engine) ──
    uint256 public ghostExpectedPrizePot;
    uint256 public ghostExpectedInstantPot;
    uint256 public ghostExpectedTreasury;

    // ── Metrics ──
    uint256 public totalBuys;
    uint256 public totalClaims;
    uint256 public buysDuringPause;
    
    constructor(NexumManager _manager, TestUSDT _usdt) {
        manager = _manager;
        usdt = _usdt;
    }

    // ── ACTION 1: Buy Tickets (economic spam simulation) ──
    function buyTickets(uint256 productId, uint256 quantity, uint256 userSeed) public {
        productId = productId % 6;
        
        // Only valid quantities
        uint256[4] memory allowed = [uint256(1), uint256(3), uint256(5), uint256(10)];
        quantity = allowed[quantity % 4];
        
        address user = address(uint160(userSeed % 1000 + 1));
        
        // Fund user
        usdt.mint(user, 100000 * 10**18);
        vm.prank(user);
        usdt.approve(address(manager), type(uint256).max);

        // Track pause state BEFORE buy attempt
        bool wasPaused = manager.paused();

        vm.prank(user);
        try manager.buyTickets(productId, quantity, address(0)) {
            totalBuys++;
            // If purchase succeeded during pause, that's a critical bug
            if (wasPaused) {
                buysDuringPause++;
            }
            // Update ghost state (FLASH product = productId 0, price = 1 USDT)
            if (productId == 0) {
                ghostExpectedPrizePot += (quantity * 10**18 * 50) / 100;
                ghostExpectedInstantPot += (quantity * 10**18 * 10) / 100;
                ghostExpectedTreasury += (quantity * 10**18 * 10) / 100;
            }
        } catch {
            // Expected: round full, product inactive, paused, etc.
        }
    }

    // ── ACTION 2: Chaos Engineering — VRF Timeout Simulation ──
    function simulateVRFTimeout(uint256 productId) public {
        productId = productId % 6;
        uint256 currentRound = manager.currentRound(productId);
        
        // Warp 8 days forward to exceed VRF_TIMEOUT (7 days)
        vm.warp(block.timestamp + 8 days);

        try manager.resolveStuckRound(productId, currentRound) {
        } catch {
            // Expected if round is not actually stuck
        }
    }

    // ── ACTION 3: Emergency Pause/Unpause interleaving ──
    function togglePause() public {
        if (manager.paused()) {
            vm.prank(manager.pauseGuardian());
            manager.emergencyUnpause();
        } else {
            vm.prank(manager.pauseGuardian());
            manager.emergencyPause();
        }
    }

    // ── ACTION 4: Claim stable rewards (pull payment test) ──
    function claimStable(uint256 userSeed) public {
        address user = address(uint160(userSeed % 1000 + 1));
        
        vm.prank(user);
        try manager.claimStable() {
            totalClaims++;
        } catch {
            // Expected: nothing to claim
        }
    }

    // ── ACTION 5: Provide liquidity (investor simulation) ──
    function provideLiquidity(uint256 productId, uint256 amount, uint256 userSeed) public {
        productId = productId % 6;
        amount = bound(amount, 1, 10000 * 10**18);
        address user = address(uint160(userSeed % 1000 + 1));

        usdt.mint(user, amount);
        vm.prank(user);
        usdt.approve(address(manager), amount);

        vm.prank(user);
        try manager.provideRoundLiquidity(productId, manager.currentRound(productId), amount) {
        } catch {
            // Expected: round closing, liquidity full, etc.
        }
    }
}
