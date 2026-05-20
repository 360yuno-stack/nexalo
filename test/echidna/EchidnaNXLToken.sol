// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../../contracts/NXLToken.sol";
import "../../contracts/TestUSDT.sol";

/// @title Echidna Property Tests for NXLToken
/// @notice Tests economic invariants via Echidna fuzzer
contract EchidnaNXLToken {
    NXLToken internal nxl;
    TestUSDT internal usdt;

    address internal founder = address(0xF01);
    address internal partner = address(0xFA4);

    uint256 constant TOTAL_SUPPLY = 100_000_000e18;

    constructor() {
        nxl = new NXLToken(founder, partner);
    }

    // ════════════════════════════════════════════
    // INVARIANT: Total supply never exceeds 100M
    // ════════════════════════════════════════════
    function echidna_totalSupply_lte_100M() public view returns (bool) {
        return nxl.totalSupply() <= TOTAL_SUPPLY;
    }

    // ════════════════════════════════════════════
    // INVARIANT: Total supply never goes to 0
    // ════════════════════════════════════════════
    function echidna_totalSupply_gt_0() public view returns (bool) {
        return nxl.totalSupply() > 0;
    }

    // ════════════════════════════════════════════
    // INVARIANT: Contract balance <= total supply
    // ════════════════════════════════════════════
    function echidna_contractBalance_lte_supply() public view returns (bool) {
        return nxl.balanceOf(address(nxl)) <= nxl.totalSupply();
    }

    // ════════════════════════════════════════════
    // INVARIANT: Founder vesting never exceeds 3M
    // ════════════════════════════════════════════
    function echidna_founderVesting_capped() public view returns (bool) {
        return nxl.getFounderAvailable() <= 3_000_000e18;
    }

    // ════════════════════════════════════════════
    // INVARIANT: Partner vesting never exceeds 1M
    // ════════════════════════════════════════════
    function echidna_partnerVesting_capped() public view returns (bool) {
        return nxl.getPartnerAvailable() <= 1_000_000e18;
    }
}
