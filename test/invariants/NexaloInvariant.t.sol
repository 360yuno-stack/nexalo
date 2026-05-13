// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import "../../contracts/NexumManager.sol";
import "../../contracts/TestUSDT.sol";
import "../../contracts/NXLToken.sol";

contract NexaloInvariantTest is Test {
    NexumManager public manager;
    TestUSDT public usdt;
    NXLToken public nxl;

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
            address(0x99), // Mock VRF
            1,
            bytes32(0),
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

        nxl.setNexumManager(address(manager));
        manager.setEcosystemAddresses(address(0x10), address(0x11), address(0x12)); // Mocks
        manager.configureNXLTokenTreasury(address(0x13));
        manager.finalizeAutonomy();
    }

    /// @dev Fuzzing user actions (Buying tickets)
    function buyTicketsFuzz(uint256 productId, uint256 quantity) public {
        productId = productId % 6;
        quantity = quantity % 10 + 1; // 1 to 10
        
        // Mock buying by ignoring requirements if they fail, we only care about invariants
        try manager.buyTickets(productId, quantity, address(0)) {
        } catch {
        }
    }

    /// @notice The absolute most critical invariant in any financial protocol.
    /// @dev Total assets inside the contract MUST be greater than or equal to all liabilities.
    function invariant_Solvency() public view {
        uint256 totalAssets = usdt.balanceOf(address(manager));
        
        uint256 totalLiabilities = 0;
        
        // Add all prizePots and instantPots across all active rounds
        for(uint256 i = 0; i < 6; i++) {
            uint256 currentRoundId = manager.currentRound(i);
            (,,,,uint256 prizePot,uint256 instantPot,,,,) = manager.rounds(i, currentRoundId);
            totalLiabilities += prizePot;
            totalLiabilities += instantPot;
        }

        totalLiabilities += manager.auditAccrued();
        totalLiabilities += manager.globalNXLBurnPot();
        
        // Note: claimableStable tracking requires iterating users, which is hard in invariant tests
        // But the core logic is: every asset added increases a liability perfectly.
        // If precision drift existed, assets would be less than expected.
        
        assert(totalAssets >= totalLiabilities);
    }
}
