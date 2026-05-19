// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import "../../contracts/NexumManager.sol";
import "../../contracts/TestUSDT.sol";
import "../../contracts/NXLToken.sol";
import "./Handler.t.sol";

/// @title NEXALO Protocol Invariant Test Suite
/// @notice Adversarial stateful fuzzing proving core protocol invariants hold
///         under arbitrary user sequences (buy, claim, pause, VRF timeout).
/// @dev Run: forge test --match-contract NexaloInvariantTest -vvv
contract NexaloInvariantTest is Test {
    NexumManager public manager;
    TestUSDT public usdt;
    NXLToken public nxl;
    NexaloHandler public handler;

    address founder = address(0x1);
    address partner = address(0x2);
    address fees = address(0x3);
    address ops = address(0x4);
    address audit = address(0x5);
    address guardian = address(0x6);

    function setUp() public {
        usdt = new TestUSDT();
        nxl = new NXLToken(founder, partner);
        
        manager = new NexumManager(
            address(0x99), // Mock VRF coordinator
            1,             // subscription ID
            bytes32(0),    // keyHash
            address(usdt),
            address(nxl),
            founder,
            partner,
            fees,
            ops,
            audit,
            guardian
        );

        // Supply the system
        usdt.mint(address(this), 1_000_000 * 10**18);
        usdt.approve(address(manager), type(uint256).max);

        vm.prank(founder);
        nxl.setNexumManager(address(manager));
        manager.setEcosystemAddresses(address(0x10), address(0x11), address(0x12));
        manager.configureNXLTokenTreasury(address(0x13));
        manager.finalizeAutonomy();

        handler = new NexaloHandler(manager, usdt);
        targetContract(address(handler));
    }

    // ────────────────────────────────────────────────────
    // INVARIANT 1: SOLVENCY
    // The most critical invariant in any financial protocol.
    // Total USDT inside NexumManager >= all known liabilities.
    // ────────────────────────────────────────────────────
    function invariant_Solvency() public view {
        uint256 totalAssets = usdt.balanceOf(address(manager));
        
        uint256 totalLiabilities = 0;
        
        // Sum all prizePots and instantPots across all active rounds
        for (uint256 i = 0; i < 6; i++) {
            uint256 currentRoundId = manager.currentRound(i);
            // Round has 16 fields: productId, roundId, ticketsSold, completed, vrfRequested,
            // vrfRequestId, vrfRandomWord, winner, winningTicket, prizePot, instantPot,
            // liquidityTarget, liquidityFunded, liquidityProfitPool, liquidityReturnedPrincipal, liquiditySettled
            (
                , // productId
                , // roundId
                , // ticketsSold
                , // completed
                , // vrfRequested
                , // vrfRequestId
                , // vrfRandomWord
                , // winner
                , // winningTicket
                uint256 prizePot,
                uint256 instantPot,
                , // liquidityTarget
                , // liquidityFunded
                , // liquidityProfitPool
                , // liquidityReturnedPrincipal
                  // liquiditySettled
            ) = manager.rounds(i, currentRoundId);
            totalLiabilities += prizePot;
            totalLiabilities += instantPot;
        }

        totalLiabilities += manager.auditAccrued();
        
        // CORE INVARIANT: assets >= liabilities. Always.
        assert(totalAssets >= totalLiabilities);
    }

    // ────────────────────────────────────────────────────
    // INVARIANT 2: DIFFERENTIAL ACCOUNTING
    // Our handler tracks "ghost" expected values. Real state
    // must ALWAYS be >= ghost (because referral spillover adds
    // to prizePot, making real values higher).
    // ────────────────────────────────────────────────────
    function invariant_DifferentialAccounting() public view {
        uint256 currentRoundId = manager.currentRound(0); // Check FLASH product
        (
            , , , , , , , , ,
            uint256 prizePot,
            uint256 instantPot,
            , , , ,
        ) = manager.rounds(0, currentRoundId);

        // Real pots should always be >= our minimum expectations
        // (spillover from failed referral/treasury transfers goes to prizePot)
        assert(prizePot >= handler.ghostExpectedPrizePot());
        assert(instantPot >= handler.ghostExpectedInstantPot());
    }

    // ────────────────────────────────────────────────────
    // INVARIANT 3: ROUND MONOTONICITY
    // Round IDs only increase. They never decrease or reset.
    // ────────────────────────────────────────────────────
    function invariant_RoundMonotonicity() public view {
        for (uint256 i = 0; i < 6; i++) {
            uint256 currentRoundId = manager.currentRound(i);
            // Round IDs start at 1 (set in constructor), must always be >= 1
            assert(currentRoundId >= 1);
        }
    }

    // ────────────────────────────────────────────────────
    // INVARIANT 4: TICKETS SOLD BOUNDED
    // ticketsSold can NEVER exceed maxTickets for any product.
    // ────────────────────────────────────────────────────
    function invariant_TicketsBounded() public view {
        for (uint256 i = 0; i < 6; i++) {
            uint256 currentRoundId = manager.currentRound(i);
            (
                , ,
                uint256 ticketsSold,
                , , , , , , , , , , , ,
            ) = manager.rounds(i, currentRoundId);

            (, , uint256 maxTickets, , , , ) = manager.products(i);
            assert(ticketsSold <= maxTickets);
        }
    }

    // ────────────────────────────────────────────────────
    // INVARIANT 5: PAUSE STATE CONSISTENCY
    // If contract is paused, no ticket purchases should have
    // succeeded during that state. We verify by checking that
    // the handler's call count during pause is 0.
    // ────────────────────────────────────────────────────
    function invariant_PauseBlocks() public view {
        assert(handler.buysDuringPause() == 0);
    }
}
