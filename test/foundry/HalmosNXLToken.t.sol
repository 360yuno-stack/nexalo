// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../../contracts/NXLToken.sol";
import "../../contracts/TestUSDT.sol";

/// @title Halmos Formal Verification Tests for NXLToken
/// @notice Uses symbolic execution to prove properties for ALL possible inputs
contract HalmosNXLToken is Test {
    NXLToken public nxl;
    TestUSDT public mockContract;

    address public founder = address(0xF01);
    address public partner = address(0xFA4);
    address public nexumMgr;

    uint256 constant TOTAL_SUPPLY = 100_000_000e18;

    function setUp() public {
        vm.startPrank(founder);
        nxl = new NXLToken(founder, partner);
        mockContract = new TestUSDT();
        nexumMgr = address(mockContract);
        nxl.setNexumManager(nexumMgr);
        vm.stopPrank();
    }

    /// @notice PROVE: distributeReward can only be called by nexumManager
    function check_distributeReward_onlyManager(address caller, address to, uint256 amount) public {
        vm.assume(caller != nexumMgr);
        vm.assume(to != address(0));
        vm.assume(amount > 0);
        vm.prank(caller);
        // This should ALWAYS revert for non-manager callers
        try nxl.distributeReward(to, amount) {
            assert(false); // Should never reach here
        } catch {
            // Expected — non-manager cannot distribute
        }
    }

    /// @notice PROVE: distributeReward never increases total supply
    function check_distributeReward_noInflation(uint256 amount) public {
        uint256 available = nxl.getAvailableRewards();
        vm.assume(amount > 0 && amount <= available);
        uint256 supplyBefore = nxl.totalSupply();
        vm.prank(nexumMgr);
        nxl.distributeReward(address(0xDEAD), amount);
        assert(nxl.totalSupply() == supplyBefore);
    }

    /// @notice PROVE: setNexumManager can never be called twice
    function check_setNexumManager_onlyOnce(address newMgr) public {
        vm.assume(newMgr != address(0));
        vm.prank(founder);
        try nxl.setNexumManager(newMgr) {
            assert(false); // Should always revert (already set)
        } catch {
            // Expected
        }
    }

    /// @notice PROVE: transfer preserves total supply
    function check_transfer_preservesSupply(address from, address to, uint256 amount) public {
        vm.assume(from != address(0) && to != address(0));
        vm.assume(from != to);
        uint256 supplyBefore = nxl.totalSupply();
        vm.prank(from);
        try nxl.transfer(to, amount) {
            assert(nxl.totalSupply() == supplyBefore);
        } catch {
            // Transfer failed, supply unchanged
            assert(nxl.totalSupply() == supplyBefore);
        }
    }
}
