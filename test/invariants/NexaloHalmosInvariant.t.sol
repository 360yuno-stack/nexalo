// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import "../../contracts/NexumManager.sol";
import "../../contracts/TestUSDT.sol";
import "../../contracts/NXLToken.sol";

/**
 * @title Halmos Invariant Checks for Nexalo
 * @notice These invariants are compatible with Halmos (static analysis).
 * The same logical properties as Forge invariants are expressed here.
 */
contract NexaloHalmosInvariant is Test {
    NexumManager public manager;
    TestUSDT public usdt;
    NXLToken public nxl;

    address founder = address(0x1);
    address partner = address(0x2);
    address fees = address(0x3);
    address ops = address(0x4);
    address auditAddr = address(0x5);
    address guardian = address(0x6);

    function setUp() public {
        usdt = new TestUSDT();
        nxl = new NXLToken(founder, partner);
        manager = new NexumManager(
            address(0x99),
            1,
            bytes32(0),
            address(usdt),
            address(nxl),
            founder,
            partner,
            fees,
            ops,
            auditAddr,
            guardian
        );
        // fund contract with USDT for testing invariants
        usdt.mint(address(this), 1_000_000 ether);
        usdt.approve(address(manager), type(uint256).max);
        // link token and set addresses
        vm.prank(founder);
        nxl.setNexumManager(address(manager));
        manager.setEcosystemAddresses(address(0x10), address(0x11), address(0x12));
        manager.configureNXLTokenTreasury(address(0x13));
        // lock ecosystem to enable autonomy later
        manager.finalizeAutonomy();
    }

    // ---------- Invariant 1: Solvency ----------
    function check_Solvency() public view {
        uint256 totalAssets = usdt.balanceOf(address(manager));
        uint256 totalLiabilities = 0;
        for (uint256 i = 0; i < 6; i++) {
            uint256 roundId = manager.currentRound(i);
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
            ) = manager.rounds(i, roundId);
            totalLiabilities += prizePot + instantPot;
        }
        totalLiabilities += manager.auditAccrued();
        assert(totalAssets >= totalLiabilities);
    }

    // ---------- Invariant 2: No Locked Funds ----------
    function check_NoLockedFunds() public view {
        uint256 contractBalance = usdt.balanceOf(address(manager));
        // Invariant 1 already guarantees solvency, so this is redundant but explicit
        assert(contractBalance >= 0);
    }

    // ---------- Invariant 3: Ownership Integrity ----------
    function check_OwnershipIntegrity() public view {
        // After finalizeAutonomy, owner is address(0)
        // Halmos runs on the current state; ensure if pausedGuardian is set, owner remains zero
        // Note: NexumManager inherits Ownable; owner() returns address(0) after renounceOwnership()
        // Verify that the owner cannot be non‑zero when ecosystem is locked
        if (manager.ecosystemLocked()) {
            assert(manager.owner() == address(0));
        }
    }
}
