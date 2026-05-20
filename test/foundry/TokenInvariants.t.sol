// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../../contracts/NXLToken.sol";
import "../../contracts/TestUSDT.sol";

/// @title NXLToken Economic Invariant Tests
contract NXLTokenInvariantTest is Test {
    NXLToken public nxl;

    address public founder = address(0xF01);
    address public partner = address(0xFA4);
    address public nexumMgr;
    address public treasuryAddr = address(0xBBB);

    uint256 constant TOTAL_SUPPLY = 100_000_000e18;

    function setUp() public {
        vm.startPrank(founder);
        nxl = new NXLToken(founder, partner);

        // Deploy a minimal mock to satisfy "must be contract" check
        TestUSDT mockContract = new TestUSDT();
        nexumMgr = address(mockContract);

        nxl.setNexumManager(nexumMgr);
        vm.stopPrank();

        // setTreasuryBTC requires onlyNexumManager
        vm.prank(nexumMgr);
        nxl.setTreasuryBTC(treasuryAddr);
    }

    /// @notice Total supply is always 100M NXL
    function testFuzz_totalSupply_neverExceeds() public view {
        assertEq(nxl.totalSupply(), TOTAL_SUPPLY, "Supply != 100M");
    }

    /// @notice All NXL held by contract at start
    function testFuzz_allTokensInContract() public view {
        assertEq(nxl.balanceOf(address(nxl)), TOTAL_SUPPLY, "Not all in contract");
    }

    /// @notice Founder vesting: 0 at t=0, 3M at t=2years
    function testFuzz_founderVesting(uint256 timeDelta) public {
        timeDelta = bound(timeDelta, 0, 730 days);
        vm.warp(block.timestamp + timeDelta);
        uint256 vested = nxl.getFounderAvailable();
        assertLe(vested, 3_000_000e18, "Founder vested > 3M");
        if (timeDelta == 0) assertEq(vested, 0, "Founder vested at t=0");
        if (timeDelta >= 730 days) assertEq(vested, 3_000_000e18, "Founder not fully vested at 2y");
    }

    /// @notice Partner vesting: 0 at t=0, 1M at t=1year
    function testFuzz_partnerVesting(uint256 timeDelta) public {
        timeDelta = bound(timeDelta, 0, 365 days);
        vm.warp(block.timestamp + timeDelta);
        uint256 vested = nxl.getPartnerAvailable();
        assertLe(vested, 1_000_000e18, "Partner vested > 1M");
        if (timeDelta == 0) assertEq(vested, 0, "Partner vested at t=0");
        if (timeDelta >= 365 days) assertEq(vested, 1_000_000e18, "Partner not fully vested at 1y");
    }

    /// @notice distributeReward only by nexumManager
    function testFuzz_distributeReward_accessControl(address caller) public {
        vm.assume(caller != nexumMgr);
        vm.prank(caller);
        vm.expectRevert();
        nxl.distributeReward(address(0xDEAD), 1e18);
    }

    /// @notice setNexumManager cannot be called twice
    function testFuzz_setNexumManager_onlyOnce(address newMgr) public {
        vm.assume(newMgr != address(0));
        vm.prank(founder);
        vm.expectRevert("Manager already set");
        nxl.setNexumManager(newMgr);
    }

    /// @notice snapshot only by treasuryBTC
    function testFuzz_snapshot_accessControl(address caller) public {
        vm.assume(caller != treasuryAddr);
        vm.prank(caller);
        vm.expectRevert();
        nxl.snapshot();
    }

    /// @notice Reward distribution reduces available correctly
    function testFuzz_distributeReward_accounting(uint256 amount) public {
        uint256 available = nxl.getAvailableRewards();
        amount = bound(amount, 1, available);

        address recipient = address(0xDEAD);
        uint256 balBefore = nxl.balanceOf(recipient);

        vm.prank(nexumMgr);
        nxl.distributeReward(recipient, amount);

        assertEq(nxl.balanceOf(recipient) - balBefore, amount, "Balance delta != amount");
        assertEq(nxl.getAvailableRewards(), available - amount, "Available not reduced");
    }
}
