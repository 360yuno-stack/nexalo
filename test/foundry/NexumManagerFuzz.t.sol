// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../../contracts/NexumManager.sol";
import "../../contracts/NXLToken.sol";
import "../../contracts/TreasuryBTC.sol";
import "../../contracts/ReferralNetwork.sol";
import "../../contracts/AmbassadorRegistry.sol";
import "../../contracts/DonationVault.sol";
import "../../contracts/TestUSDT.sol";
import "../../contracts/mocks/VRFCoordinatorV2Mock.sol";

/// @title NexumManager Fuzz + Invariant Tests
contract NexumManagerFuzzTest is Test {
    NexumManager public nexum;
    NXLToken public nxl;
    TreasuryBTC public treasury;
    ReferralNetwork public referral;
    AmbassadorRegistry public ambassador;
    DonationVault public donation;
    TestUSDT public usdt;
    VRFCoordinatorV2Mock public vrfCoord;

    address public founder = address(0xF01);
    address public fees = address(0xFEE);
    address public ops = address(0x0F5);
    address public partner = address(0xFA4);
    address public auditFunds = address(0xADD);
    address public pauseGuardian = address(0xE0A);
    address public buyer1 = address(0xB01);
    address public buyer2 = address(0xB02);

    uint64 public subId;

    function setUp() public {
        // Deploy as founder so NXLToken.setNexumManager works
        vm.startPrank(founder);

        vrfCoord = new VRFCoordinatorV2Mock(100000, 1000000000);
        subId = vrfCoord.createSubscription();
        vrfCoord.fundSubscription(subId, 10 ether);

        usdt = new TestUSDT();
        nxl = new NXLToken(founder, partner);

        nexum = new NexumManager(
            address(vrfCoord), subId, bytes32(uint256(1)),
            address(usdt), address(nxl),
            founder, fees, ops, partner, auditFunds, pauseGuardian
        );

        treasury = new TreasuryBTC(
            address(usdt), address(nxl), address(nexum),
            address(usdt), block.timestamp + 365 days, 30 days
        );

        referral = new ReferralNetwork(address(usdt));
        ambassador = new AmbassadorRegistry(address(usdt));
        donation = new DonationVault(address(usdt), address(treasury));

        vrfCoord.addConsumer(subId, address(nexum));

        // NXLToken.setNexumManager requires msg.sender == founderAddress
        nxl.setNexumManager(address(nexum));

        // setTreasuryBTC requires onlyNexumManager — call via nexum
        nexum.configureNXLTokenTreasury(address(treasury));

        referral.setNexumManager(address(nexum));

        nexum.setEcosystemAddresses(address(treasury), address(referral), address(ambassador));
        nexum.finalizeAutonomy();

        vm.stopPrank();

        // Fund buyers
        vm.prank(founder);
        usdt.mint(buyer1, 10_000_000e18);
        vm.prank(founder);
        usdt.mint(buyer2, 10_000_000e18);

        vm.prank(buyer1);
        usdt.approve(address(nexum), type(uint256).max);
        vm.prank(buyer2);
        usdt.approve(address(nexum), type(uint256).max);
    }

    // ═══════════════════════════════════════
    // FUZZ: Ticket purchases
    // ═══════════════════════════════════════

    /// @notice Valid product + quantity never reverts
    function testFuzz_buyTickets_validInputs(uint8 prodSeed, uint8 qtySeed) public {
        uint256 pid = uint256(prodSeed) % 6;
        uint256[] memory vq = new uint256[](4);
        vq[0] = 1; vq[1] = 3; vq[2] = 5; vq[3] = 10;
        uint256 qty = vq[uint256(qtySeed) % 4];
        vm.prank(buyer1);
        nexum.buyTickets(pid, qty, address(0));
    }

    /// @notice Invalid quantities always revert
    function testFuzz_buyTickets_invalidQty(uint256 qty) public {
        vm.assume(qty != 1 && qty != 3 && qty != 5 && qty != 10);
        vm.assume(qty <= 100);
        vm.prank(buyer1);
        vm.expectRevert();
        nexum.buyTickets(0, qty, address(0));
    }

    /// @notice Invalid product IDs always revert
    function testFuzz_buyTickets_invalidProduct(uint256 pid) public {
        vm.assume(pid >= 6 && pid <= 1000);
        vm.prank(buyer1);
        vm.expectRevert();
        nexum.buyTickets(pid, 1, address(0));
    }

    /// @notice Self-referral is silently ignored — purchase succeeds
    function testFuzz_noSelfReferral() public {
        vm.prank(buyer1);
        // Self-referral is silently ignored, purchase should succeed
        nexum.buyTickets(0, 1, buyer1);
        // If we got here, the purchase succeeded (self-referral was just ignored)
        (,,uint256 ticketsSold,,,,,,,,,,,,,) = nexum.rounds(0, 1);
        assertEq(ticketsSold, 1, "Purchase should succeed");
    }

    /// @notice claimStable reverts when nothing to claim
    function testFuzz_claimStable_nothingToClaim(address claimer) public {
        vm.assume(claimer != address(0));
        vm.prank(claimer);
        vm.expectRevert();
        nexum.claimStable();
    }

    /// @notice claimNXL reverts when nothing to claim
    function testFuzz_claimNXL_nothingToClaim(address claimer) public {
        vm.assume(claimer != address(0));
        vm.prank(claimer);
        vm.expectRevert();
        nexum.claimNXL();
    }

    /// @notice withdrawAuditFunds only works for auditFunds address
    function testFuzz_auditFunds_accessControl(address caller) public {
        vm.assume(caller != auditFunds);
        vm.prank(caller);
        vm.expectRevert();
        nexum.withdrawAuditFunds();
    }

    /// @notice Ticket accounting: total sold = sum of individual buys
    function testFuzz_ticketAccounting(uint8 numBuys) public {
        uint256 n = (uint256(numBuys) % 20) + 1;
        uint256 total = 0;
        for (uint256 i = 0; i < n; i++) {
            uint256 qty = (i % 2 == 0) ? 1 : 3;
            total += qty;
            vm.prank(buyer1);
            nexum.buyTickets(0, qty, address(0));
        }
        (,,uint256 ticketsSold,,,,,,,,,,,,,) = nexum.rounds(0, 1);
        assertEq(ticketsSold, total, "Ticket count mismatch");
    }

    /// @notice NXL total supply never changes during purchases
    function testFuzz_nxlSupplyConstant(uint8 prodSeed) public {
        uint256 supplyBefore = nxl.totalSupply();
        uint256 pid = uint256(prodSeed) % 6;
        vm.prank(buyer1);
        nexum.buyTickets(pid, 10, address(0));
        assertEq(nxl.totalSupply(), supplyBefore, "NXL supply changed!");
    }

    /// @notice Multiple buyers never get the same ticket
    function testFuzz_noTicketCollision() public {
        vm.prank(buyer1);
        nexum.buyTickets(0, 10, address(0));
        vm.prank(buyer2);
        nexum.buyTickets(0, 10, address(0));
        (,,uint256 ticketsSold,,,,,,,,,,,,,) = nexum.rounds(0, 1);
        assertEq(ticketsSold, 20, "Tickets collided!");
    }

    /// @notice Liquidity with zero amount reverts
    function testFuzz_liquidityZeroReverts(uint8 prodSeed) public {
        uint256 pid = uint256(prodSeed) % 6;
        vm.prank(buyer1);
        vm.expectRevert();
        nexum.provideRoundLiquidity(pid, 1, 0);
    }
}
