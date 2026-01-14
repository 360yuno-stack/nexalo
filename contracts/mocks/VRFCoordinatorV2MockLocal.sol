// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

/**
 * Wrapper local para que Hardhat genere artifact sin depender del path fully-qualified de node_modules.
 */
contract VRFCoordinatorV2MockLocal is VRFCoordinatorV2Mock {
    constructor(uint96 baseFee, uint96 gasPriceLink)
        VRFCoordinatorV2Mock(baseFee, gasPriceLink)
    {}
}
