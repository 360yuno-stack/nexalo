// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @dev Minimal stub that satisfies NXLToken's code.length > 0 check.
///      Used in tests to bootstrap the NXL-Manager circular dependency.
///      In tests: deploy this first, deploy NXL pointing here, then deploy real
///      NexumManager. NXL.nexumManager will be this stub, but we deploy a SEPARATE
///      NXLToken for the real manager in the actual test fixtures.
contract MockNexumManagerStub {
    // Empty — just needs to exist as a contract at the address
}
